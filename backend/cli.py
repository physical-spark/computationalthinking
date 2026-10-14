import argparse

from .db import SessionLocal
from .models import Learner

p = argparse.ArgumentParser()
p.add_argument("command", choices=["grant-admin"])
p.add_argument("learner_id")
a = p.parse_args()
with SessionLocal.begin() as db:
    u = db.get(Learner, a.learner_id)
    if not u or not u.google_sub:
        raise SystemExit("A Google-connected learner ID is required")
    u.admin = True
    print("Administrator role granted to", u.id)
