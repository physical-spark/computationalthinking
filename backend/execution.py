"""Authenticated same-origin WebSocket proxy to the private sandbox broker."""

import asyncio
import contextlib
import json
import os
import time

from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from websockets.asyncio.client import connect

from .db import SessionLocal

router = APIRouter()


@router.websocket("/api/v1/runner")
async def execution(ws: WebSocket):
    from .main import APP_ORIGIN, identity, validate_step

    if ws.headers.get("origin") != APP_ORIGIN:
        await ws.close(code=4403)
        return
    try:
        with SessionLocal() as db:
            user = identity(ws, db)
            uid = user.id
    except HTTPException:
        await ws.close(code=4401)
        return
    token = os.environ.get("CT_BROKER_TOKEN", "")
    url = os.environ.get("CT_BROKER_URL", "")
    await ws.accept()
    if not url or len(token) < 32:
        await ws.send_json(
            {
                "type": "error",
                "reset": True,
                "message": "서버 실행 환경을 준비 중입니다. 잠시 뒤 다시 시도해 주세요.",
            }
        )
        await ws.close(code=1013)
        return
    tasks = []
    try:
        async with connect(
            url.rstrip("/") + "/session/" + uid,
            additional_headers={"Authorization": "Bearer " + token},
            max_size=2_100_000,
            open_timeout=10,
        ) as broker:

            async def to_broker():
                runs = []
                while True:
                    raw = await ws.receive_text()
                    if len(raw.encode()) > 80_000:
                        await ws.close(code=1009)
                        return
                    value = json.loads(raw)
                    kind = value.get("type")
                    if kind == "run":
                        # Recheck expiry/Google identity on every new execution.
                        with SessionLocal() as db:
                            identity(ws, db)
                        now = time.monotonic()
                        runs[:] = [t for t in runs if t > now - 60]
                        if len(runs) >= 60:
                            await ws.send_json(
                                {
                                    "type": "error",
                                    "id": value.get("id"),
                                    "message": "실행 요청이 많습니다. 잠시 뒤 다시 실행해 주세요.",
                                }
                            )
                            continue
                        entry = value.get("entry", {})
                        validate_step(
                            str(entry.get("page_slug", "")) + "." + str(entry.get("step_name", "")),
                            gradable=True,
                        )
                        if (
                            not isinstance(entry.get("input"), str)
                            or len(entry["input"]) > 64000
                            or entry.get("source")
                            not in {"shell", "editor", "snoop", "birdseye", "pythontutor"}
                        ):
                            await ws.close(code=1008)
                            return
                        runs.append(now)
                    elif kind not in {"input", "stop", "restart"}:
                        await ws.close(code=1008)
                        return
                    await broker.send(raw)

            async def to_browser():
                async for raw in broker:
                    await ws.send_text(raw)

            tasks = [asyncio.create_task(to_broker()), asyncio.create_task(to_browser())]
            done, _ = await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
            for task in done:
                task.result()
    except (WebSocketDisconnect, asyncio.CancelledError):
        pass
    except Exception:
        with contextlib.suppress(Exception):
            await ws.send_json(
                {
                    "type": "error",
                    "reset": True,
                    "message": "실행 연결이 종료됐습니다. 다시 준비하면 코드 입력은 유지되고 셸 변수는 초기화됩니다.",
                }
            )
    finally:
        for task in tasks:
            task.cancel()
        if tasks:
            await asyncio.gather(*tasks, return_exceptions=True)
        with contextlib.suppress(Exception):
            await ws.close()
