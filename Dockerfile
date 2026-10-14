FROM node:22-bookworm-slim AS frontend
WORKDIR /build
COPY web/package*.json web/
COPY runner/package*.json runner/
RUN cd web && npm ci && cd ../runner && npm ci
COPY web web
COPY runner runner
ENV VITE_RUNNER_ORIGIN=https://computationalthinking-runner.futurereadycampus.com
ENV VITE_CONTENT_LANGUAGE=ko
ENV VITE_APP_ORIGIN=https://computationalthinking.futurereadycampus.com
RUN cd web && npm run build && cd ../runner && npm run build
FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY --from=ghcr.io/astral-sh/uv:0.11.24 /uv /uvx /bin/
COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev
ENV PATH=/app/.venv/bin:$PATH
COPY backend backend
COPY alembic.ini ./
COPY content/course.json content/course.json
COPY --from=frontend /build/web/dist web/dist
COPY --from=frontend /build/runner/dist runner/dist
RUN useradd --uid 10001 --create-home app
USER app
CMD ["uvicorn","backend.main:app","--host","0.0.0.0","--port","8000","--proxy-headers"]
