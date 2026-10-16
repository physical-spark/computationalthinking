"""Private-broker verification, with synthetic sessions and no student records."""

import asyncio
import json
import os
import statistics
import time
import uuid
from websockets.asyncio.client import connect

URL = os.environ.get("CT_BROKER_URL", "ws://127.0.0.1:8766")
TOKEN = os.environ["CT_BROKER_TOKEN"]
ENTRY = {
    "input": "1+2",
    "source": "shell",
    "page_slug": "IntroducingTheShell",
    "step_name": "first_expression",
}


async def opened():
    ws = await connect(
        URL + "/session/validation-" + uuid.uuid4().hex,
        additional_headers={"Authorization": "Bearer " + TOKEN},
        max_size=2_100_000,
    )
    while json.loads(await asyncio.wait_for(ws.recv(), 60))["type"] != "ready":
        pass
    return ws


async def run(ws, code, source="editor"):
    await ws.send(
        json.dumps(
            {
                "type": "run",
                "id": uuid.uuid4().hex,
                "entry": {**ENTRY, "input": code, "source": source},
            }
        )
    )
    output = ""
    while True:
        e = json.loads(await asyncio.wait_for(ws.recv(), 65))
        if e["type"] == "output":
            output += "".join(x.get("text", "") for x in e["parts"])
        if e["type"] in {"result", "error"}:
            return e, output


async def main():
    ws = await opened()
    try:
        e, out = await run(ws, "state=41", "shell")
        e, out = await run(ws, "state+1", "shell")
        assert out == "42\n"
        second = await opened()
        try:
            e, out = await run(second, "print('state' in globals())")
            assert out == "False\n"
        finally:
            await second.close()
        e, out = await run(
            ws,
            "import os\nprint(os.environ.get('CT_BROKER_TOKEN'))\nprint(os.path.exists('/var/run/docker.sock'))\nprint(os.path.exists('/app/backend'))",
        )
        assert out == "None\nFalse\nFalse\n", out
        e, out = await run(
            ws,
            "import socket\ns=socket.socket()\ns.settimeout(1)\ntry:\n    s.connect(('1.1.1.1',443))\n    print('NETWORK_OPEN')\nexcept OSError:\n    print('NETWORK_BLOCKED')",
        )
        assert "NETWORK_BLOCKED" in out and "NETWORK_OPEN" not in out
    finally:
        await ws.close()
    barrier = asyncio.Barrier(30)
    startup = []

    async def learner(i):
        t = time.monotonic()
        ws = await opened()
        startup.append(time.monotonic() - t)
        try:
            await asyncio.wait_for(barrier.wait(), 90)
            t = time.monotonic()
            e, out = await run(ws, "1+2", "shell")
            assert out == "3\n" and e["result"]["passed"], (i, e, out)
            return time.monotonic() - t
        finally:
            await ws.close()

    latencies = await asyncio.gather(*(learner(i) for i in range(30)))
    result = {
        "timestamp": time.time(),
        "sessions": 30,
        "successful_runs": 30,
        "failures": 0,
        "execution_p95_seconds": sorted(latencies)[28],
        "execution_max_seconds": max(latencies),
        "cold_session_p95_seconds": sorted(startup)[28],
        "shell_state_preserved": True,
        "learner_state_isolated": True,
        "network_blocked": True,
        "no_host_secrets_or_docker_socket": True,
        "boundary": "private broker with synthetic identities; not public OAuth end-to-end",
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    asyncio.run(main())
