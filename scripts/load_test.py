"""30-learner verification against a disposable database only."""

import concurrent.futures, json, os, statistics, subprocess, sys, time, uuid
from pathlib import Path
from urllib.parse import urlparse

url = os.environ.get("DATABASE_URL", "")
if not urlparse(url).path.endswith("_validation"):
    raise SystemExit("Refusing to run outside a disposable *_validation database")
os.environ["COOKIE_SECURE"] = "false"
os.environ["APP_ORIGIN"] = "http://127.0.0.1:8100"
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import httpx
from backend.db import SessionLocal
from backend.models import Learner

subprocess.run([sys.executable, "-m", "alembic", "upgrade", "head"], check=True)
server = subprocess.Popen(
    [sys.executable, "-m", "uvicorn", "backend.main:app", "--host", "127.0.0.1", "--port", "8100"],
    stdout=subprocess.DEVNULL,
    stderr=subprocess.DEVNULL,
)
base = "http://127.0.0.1:8100"
headers = {"Origin": base}
timings = []
try:
    for _ in range(100):
        try:
            if httpx.get(base + "/healthz").status_code == 200:
                break
        except httpx.HTTPError:
            pass
        time.sleep(0.1)
    else:
        raise RuntimeError("Test server did not start")
    with httpx.Client(base_url=base, headers=headers) as admin:
        u = admin.get("/api/v1/me").json()
        with SessionLocal.begin() as db:
            user = db.get(Learner, u["id"])
            user.admin = True
            user.google_sub = "synthetic-validation-owner"
        cohort = admin.post(
            "/api/v1/admin/cohorts", json={"name": "30-learner isolated validation"}
        ).json()
        course = admin.get("/api/v1/course").json()
        task = course["pages"][0]["steps"][0]["id"]
        version = course["version"]

        def learn(n):
            elapsed = []
            with httpx.Client(base_url=base, headers=headers, timeout=30) as client:

                def request(method, path, data=None):
                    t = time.perf_counter()
                    r = client.request(method, path, json=data)
                    elapsed.append(time.perf_counter() - t)
                    r.raise_for_status()
                    return r.json()

                request("GET", "/api/v1/me")
                request("POST", "/api/v1/cohorts/join", {"code": cohort["code"]})
                request("POST", "/api/v1/view", {"step_id": task, "version": version})
                request(
                    "PUT",
                    "/api/v1/drafts",
                    {"step_id": task, "version": version, "code": "1+2", "revision": 0},
                )
                for k in range(10):
                    request(
                        "POST",
                        "/api/v1/attempts",
                        {
                            "id": str(uuid.uuid4()),
                            "step_id": task,
                            "version": version,
                            "code": "1+2",
                            "passed": k == 9,
                            "hints": 0,
                        },
                    )
                request(
                    "POST",
                    "/api/v1/questions",
                    {
                        "id": str(uuid.uuid4()),
                        "step_id": task,
                        "body": "격리된 부하 검증 전용 질문입니다.",
                    },
                )
                progress = request("GET", "/api/v1/progress")
                assert progress["progress"][0]["passed"]
            return elapsed

        started = time.perf_counter()
        with concurrent.futures.ThreadPoolExecutor(max_workers=30) as pool:
            for result in pool.map(learn, range(30)):
                timings.extend(result)
        learners = admin.get("/api/v1/admin/learners?cohort=" + cohort["id"]).json()
        assert len(learners) == 30 and all(
            u["passed"] == 1 and u["attempts"] == 10 for u in learners
        )
        ordered = sorted(timings)
        report = {
            "users": 30,
            "requests": len(timings),
            "elapsed_seconds": round(time.perf_counter() - started, 3),
            "p95_seconds": round(ordered[int(len(ordered) * 0.95) - 1], 3),
            "max_seconds": round(max(timings), 3),
            "errors": 0,
            "database": "disposable validation DB",
        }
        print(json.dumps(report))
        assert report["p95_seconds"] < 2.0
finally:
    server.terminate()
    server.wait(timeout=10)
