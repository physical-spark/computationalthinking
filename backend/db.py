import os

from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker

url = os.environ.get("DATABASE_URL", "sqlite:///./.cache/dev.db")
engine = create_engine(
    url,
    pool_pre_ping=True,
    hide_parameters=True,
    connect_args={"check_same_thread": False} if url.startswith("sqlite") else {},
)
if url.startswith("sqlite"):

    @event.listens_for(engine, "connect")
    def sqlite_fk(conn, _):
        conn.execute("PRAGMA foreign_keys=ON")


SessionLocal = sessionmaker(engine, expire_on_commit=False)


def database():
    with SessionLocal() as db:
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
