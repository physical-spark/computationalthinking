"""Cookie-free static execution origin, with no learning-record API."""

import os
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles

app = FastAPI(docs_url=None, redoc_url=None, openapi_url=None)
APP_ORIGIN = os.environ.get("APP_ORIGIN", "https://computationalthinking.futurereadycampus.com")


@app.middleware("http")
async def headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["Content-Security-Policy"] = (
        f"default-src 'self'; script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; connect-src 'self'; img-src 'self' data:; font-src 'self'; worker-src 'self' blob:; frame-ancestors {APP_ORIGIN}; base-uri 'none'; form-action 'none'"
    )
    response.headers["Cross-Origin-Resource-Policy"] = "cross-origin"
    response.headers["X-Content-Type-Options"] = "nosniff"
    if request.url.path == "/service-worker.js":
        response.headers["Cache-Control"] = "no-cache"
    return response


@app.get("/healthz")
def health():
    return {"status": "ok"}


app.mount(
    "/",
    StaticFiles(directory=Path(__file__).resolve().parents[1] / "runner/dist", html=True),
    name="runner",
)
