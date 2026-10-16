"""Private, single-process execution broker. Never exposed by the public tunnel.

The app authenticates Google sessions; this broker authenticates the app. Docker
arguments are fixed here. The untrusted interpreter receives no token, mount,
network, database or Docker socket. Every connection gets its own sandbox.
"""

import asyncio
import contextlib
import hmac
import json
import os
import time
import uuid
from collections import Counter

from fastapi import FastAPI, WebSocket, WebSocketDisconnect

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
TOKEN = os.environ.get("CT_BROKER_TOKEN", "")
IMAGE = os.environ.get("CT_EXECUTION_IMAGE", "ct-python:local")
PARENT = os.environ.get("CT_CGROUP_PARENT", "")
SCOPE = os.environ.get("CT_BROKER_SCOPE", "production")
pool = asyncio.Queue(maxsize=4)
warming = None
slots = asyncio.Semaphore(4)
connections = Counter()


@app.get("/healthz")
def health():
    return {"status": "ok", "sessions": sum(connections.values()), "parallel_runs": 4}


async def docker(*args):
    p = await asyncio.create_subprocess_exec(
        "docker", *args, stdout=asyncio.subprocess.PIPE, stderr=asyncio.subprocess.PIPE
    )
    out, err = await p.communicate()
    if p.returncode:
        raise RuntimeError(err.decode(errors="replace")[:500])
    return out


class Sandbox:
    def __init__(self):
        self.name = "ct-python-" + uuid.uuid4().hex
        self.process = None

    async def start(self):
        args = [
            "docker",
            "run",
            "--rm",
            "-i",
            "--name",
            self.name,
            "--label",
            "ct.execution=1",
            "--label",
            "ct.execution.scope=" + SCOPE,
            "--runtime=runsc",
            "--network=none",
            "--read-only",
            "--cap-drop=ALL",
            "--security-opt=no-new-privileges",
            "--memory=512m",
            "--memory-swap=512m",
            "--cpus=0.5",
            "--pids-limit=64",
            "--ulimit",
            "nofile=128:128",
            "--tmpfs",
            "/tmp:rw,nosuid,nodev,size=33554432,mode=1777",
            "--log-driver=none",
        ]
        if PARENT:
            args += ["--cgroup-parent", PARENT]
        self.process = await asyncio.create_subprocess_exec(
            *args,
            IMAGE,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.DEVNULL,
            limit=2_100_000,
        )
        event = await self.read(40)
        if event.get("type") != "ready":
            raise RuntimeError("Python 초기화를 마치지 못했습니다.")

    async def read(self, timeout):
        line = await asyncio.wait_for(self.process.stdout.readline(), timeout)
        if not line:
            raise RuntimeError("실행 환경이 종료됐습니다. 다시 준비해 주세요.")
        if len(line) > 2_000_000:
            raise RuntimeError("실행 결과가 너무 큽니다. 출력할 내용을 줄여 주세요.")
        try:
            return json.loads(line)
        except json.JSONDecodeError as error:
            raise RuntimeError("실행 응답이 올바르지 않습니다. 다시 준비해 주세요.") from error

    async def write(self, data):
        self.process.stdin.write((json.dumps(data) + "\n").encode())
        await self.process.stdin.drain()

    async def close(self):
        with contextlib.suppress(Exception):
            await docker("rm", "-f", self.name)
        if self.process and self.process.returncode is None:
            with contextlib.suppress(ProcessLookupError):
                self.process.kill()
            await self.process.wait()


@app.websocket("/session/{learner}")
async def session(ws: WebSocket, learner: str):
    if len(TOKEN) < 32 or not hmac.compare_digest(
        ws.headers.get("authorization", ""), "Bearer " + TOKEN
    ):
        await ws.close(code=4401)
        return
    if sum(connections.values()) >= 32 or connections[learner] >= 2:
        await ws.close(code=4429)
        return
    connections[learner] += 1
    await ws.accept()
    sandbox = None
    task = None
    inputs = asyncio.Queue(maxsize=1)

    async def prepare():
        nonlocal sandbox
        await ws.send_json({"type": "progress", "message": "서버의 Python 실행 환경을 준비합니다."})
        try:
            sandbox = pool.get_nowait()
        except asyncio.QueueEmpty:
            sandbox = Sandbox()
            async with slots:
                await sandbox.start()
        await ws.send_json({"type": "ready"})

    async def execute(entry, run_id):
        held = False
        try:
            await ws.send_json({"type": "progress", "message": "실행 순서를 기다립니다."})
            await asyncio.wait_for(slots.acquire(), 60)
            held = True
            await ws.send_json({"type": "progress", "message": "서버에서 실행 중입니다."})
            await sandbox.write(entry)
            deadline = time.monotonic() + 30
            output_size = 0
            while True:
                event = await sandbox.read(max(0.01, deadline - time.monotonic()))
                kind = event.get("type")
                if kind not in {"output", "input", "result", "error"}:
                    raise RuntimeError("실행 응답을 확인하지 못했습니다.")
                output_size += len(json.dumps(event))
                if output_size > 2_000_000:
                    raise RuntimeError("출력 제한에 도달했습니다. 출력할 내용을 줄여 주세요.")
                await ws.send_json({**event, "id": run_id})
                if kind in {"result", "error"}:
                    break
                if kind == "input":
                    remaining = max(0.01, deadline - time.monotonic())
                    slots.release()
                    held = False
                    text = await asyncio.wait_for(inputs.get(), 120)
                    await asyncio.wait_for(slots.acquire(), 60)
                    held = True
                    deadline = time.monotonic() + remaining
                    await sandbox.write({"text": text})
        except asyncio.CancelledError:
            raise
        except Exception as error:
            await sandbox.close()
            await ws.send_json(
                {
                    "type": "error",
                    "id": run_id,
                    "reset": True,
                    "message": str(error) or "실행 제한 시간을 넘겼습니다. 다시 준비해 주세요.",
                }
            )
        finally:
            if held:
                slots.release()

    try:
        await prepare()
        while True:
            data = json.loads(await asyncio.wait_for(ws.receive_text(), 600))
            if len(json.dumps(data)) > 80_000:
                break
            kind = data.get("type")
            if kind == "run" and (task is None or task.done()):
                entry = data.get("entry", {})
                if (
                    not isinstance(entry.get("input"), str)
                    or len(entry["input"]) > 64000
                    or entry.get("source")
                    not in {"shell", "editor", "snoop", "birdseye", "pythontutor"}
                ):
                    break
                while not inputs.empty():
                    inputs.get_nowait()
                task = asyncio.create_task(execute(entry, str(data.get("id", ""))[:50]))
            elif (
                kind == "input" and isinstance(data.get("text"), str) and len(data["text"]) <= 4000
            ):
                if inputs.empty():
                    inputs.put_nowait(data["text"])
            elif kind in {"stop", "restart"}:
                if task:
                    task.cancel()
                    with contextlib.suppress(asyncio.CancelledError):
                        await task
                await sandbox.close()
                sandbox = None
                await ws.send_json(
                    {
                        "type": "reset",
                        "message": "실행을 중지하고 다시 준비합니다. 코드 입력은 유지되고 셸 변수는 초기화됩니다.",
                    }
                )
                await prepare()
    except (WebSocketDisconnect, asyncio.TimeoutError):
        pass
    except Exception:
        with contextlib.suppress(Exception):
            await ws.send_json(
                {
                    "type": "error",
                    "reset": True,
                    "message": "서버 실행 환경에 연결하지 못했습니다. 다시 준비해 주세요.",
                }
            )
    finally:
        if task:
            task.cancel()
            with contextlib.suppress(asyncio.CancelledError, Exception):
                await task
        if sandbox:
            await sandbox.close()
        connections[learner] -= 1
        if connections[learner] == 0:
            del connections[learner]
        with contextlib.suppress(Exception):
            await ws.close()


async def warm_pool():
    pending = None
    try:
        while True:
            if not pool.full() and sum(connections.values()) + pool.qsize() < 32:
                pending = Sandbox()
                try:
                    async with slots:
                        await pending.start()
                    await pool.put(pending)
                    pending = None
                except Exception:
                    await pending.close()
                    pending = None
                    await asyncio.sleep(5)
            else:
                await asyncio.sleep(1)
    finally:
        if pending:
            await pending.close()


@app.on_event("startup")
async def startup():
    global warming
    # Remove only this broker's orphaned sandboxes after a broker/node restart.
    old = (
        (await docker("ps", "-aq", "--filter", "label=ct.execution.scope=" + SCOPE))
        .decode()
        .split()
    )
    if old:
        await docker("rm", "-f", *old)
    warming = asyncio.create_task(warm_pool())


@app.on_event("shutdown")
async def shutdown():
    if warming:
        warming.cancel()
        with contextlib.suppress(asyncio.CancelledError):
            await warming
    while not pool.empty():
        await pool.get_nowait().close()
