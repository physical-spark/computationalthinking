"""Real sandbox protocol regression: long output, flood cutoff and timeout."""

import asyncio
import json
import time
from verify_execution import opened, run


async def main():
    ws = await opened()
    try:
        result, output = await run(ws, "for _ in range(50): print('x'*10000)")
        assert result["type"] == "result", result
        assert output == ("x" * 10000 + "\n") * 50, len(output)
    finally:
        await ws.close()
    ws = await opened()
    try:
        result, output = await run(ws, "while True: print('x'*10000)")
        assert result["type"] == "error" and result.get("reset"), result
        assert "출력 제한" in result["message"], result
    finally:
        await ws.close()
    ws = await opened()
    try:
        start = time.monotonic()
        result, _ = await run(ws, "while True: pass")
        elapsed = time.monotonic() - start
        assert result["type"] == "error" and result.get("reset"), result
        assert "제한 시간" in result["message"] and 29 <= elapsed <= 40, (result, elapsed)
    finally:
        await ws.close()
    print(
        json.dumps(
            {
                "long_output_bytes": 500050,
                "long_output_complete": True,
                "output_flood_stopped": True,
                "infinite_loop_stopped": True,
                "timeout_seconds": round(elapsed, 2),
            }
        )
    )


if __name__ == "__main__":
    asyncio.run(main())
