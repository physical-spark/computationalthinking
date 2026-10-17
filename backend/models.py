import time
import uuid
from datetime import date

from sqlalchemy import Boolean, Date, Float, ForeignKey, Integer, LargeBinary, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


def uid():
    return str(uuid.uuid4())


class Learner(Base):
    __tablename__ = "learners"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    nickname: Mapped[str] = mapped_column(String(40))
    full_name: Mapped[str | None] = mapped_column(String(80), nullable=True)
    birth_date: Mapped[date | None] = mapped_column(Date, nullable=True)
    avatar_id: Mapped[str | None] = mapped_column(String(20), nullable=True)
    avatar_version: Mapped[str | None] = mapped_column(String(64), nullable=True)
    google_sub: Mapped[str | None] = mapped_column(String(255), unique=True, nullable=True)
    admin: Mapped[bool] = mapped_column(Boolean, default=False)
    created: Mapped[float] = mapped_column(Float, default=time.time)
    active: Mapped[float] = mapped_column(Float, default=time.time)
    current_step: Mapped[str] = mapped_column(String(200), default="")


class ProfileImage(Base):
    __tablename__ = "profile_images"
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), primary_key=True
    )
    image: Mapped[bytes] = mapped_column(LargeBinary)


class Session(Base):
    __tablename__ = "sessions"
    token_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), index=True
    )
    expires: Mapped[float] = mapped_column(Float)


class Cohort(Base):
    __tablename__ = "cohorts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    name: Mapped[str] = mapped_column(String(100))
    code: Mapped[str] = mapped_column(String(20), unique=True)
    archived: Mapped[bool] = mapped_column(Boolean, default=False)


class Membership(Base):
    __tablename__ = "memberships"
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), primary_key=True
    )
    cohort_id: Mapped[str] = mapped_column(
        ForeignKey("cohorts.id", ondelete="CASCADE"), primary_key=True
    )


class Draft(Base):
    __tablename__ = "drafts"
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), primary_key=True
    )
    step_id: Mapped[str] = mapped_column(String(200), primary_key=True)
    code: Mapped[str] = mapped_column(Text, default="")
    version: Mapped[str] = mapped_column(String(80))
    revision: Mapped[int] = mapped_column(Integer, default=1)
    updated: Mapped[float] = mapped_column(Float, default=time.time)


class DraftConflict(Base):
    __tablename__ = "draft_conflicts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), index=True
    )
    step_id: Mapped[str] = mapped_column(String(200))
    code: Mapped[str] = mapped_column(Text)
    version: Mapped[str] = mapped_column(String(80))
    created: Mapped[float] = mapped_column(Float, default=time.time)


class Progress(Base):
    __tablename__ = "progress"
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), primary_key=True
    )
    step_id: Mapped[str] = mapped_column(String(200), primary_key=True)
    viewed: Mapped[bool] = mapped_column(Boolean, default=True)
    passed: Mapped[bool] = mapped_column(Boolean, default=False)
    version: Mapped[str] = mapped_column(String(80))
    updated: Mapped[float] = mapped_column(Float, default=time.time)


class Attempt(Base):
    __tablename__ = "attempts"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), index=True
    )
    step_id: Mapped[str] = mapped_column(String(200), index=True)
    version: Mapped[str] = mapped_column(String(80))
    code: Mapped[str] = mapped_column(Text)
    passed: Mapped[bool] = mapped_column(Boolean)
    hints: Mapped[int] = mapped_column(Integer, default=0)
    source: Mapped[str] = mapped_column(String(30), default="browser")
    created: Mapped[float] = mapped_column(Float, default=time.time)


class Reflection(Base):
    __tablename__ = "reflections"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), index=True
    )
    step_id: Mapped[str] = mapped_column(String(200))
    version: Mapped[str] = mapped_column(String(80))
    choice: Mapped[int | None] = mapped_column(Integer, nullable=True)
    explanation: Mapped[str] = mapped_column(Text, default="")
    created: Mapped[float] = mapped_column(Float, default=time.time)


class Question(Base):
    __tablename__ = "questions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    learner_id: Mapped[str] = mapped_column(
        ForeignKey("learners.id", ondelete="CASCADE"), index=True
    )
    step_id: Mapped[str] = mapped_column(String(200))
    body: Mapped[str] = mapped_column(Text)
    resolved: Mapped[bool] = mapped_column(Boolean, default=False)
    created: Mapped[float] = mapped_column(Float, default=time.time)
    read_at: Mapped[float] = mapped_column(Float, default=0)


class Reply(Base):
    __tablename__ = "replies"
    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    question_id: Mapped[str] = mapped_column(
        ForeignKey("questions.id", ondelete="CASCADE"), index=True
    )
    author_id: Mapped[str] = mapped_column(ForeignKey("learners.id"))
    body: Mapped[str] = mapped_column(Text)
    created: Mapped[float] = mapped_column(Float, default=time.time)


class RateBucket(Base):
    __tablename__ = "rate_buckets"
    key: Mapped[str] = mapped_column(String(160), primary_key=True)
    count: Mapped[int] = mapped_column(Integer, default=1)


class AdminClaim(Base):
    """One-time binding of an explicitly configured administrator to Google sub."""

    __tablename__ = "admin_claims"
    email_hash: Mapped[str] = mapped_column(String(64), primary_key=True)
    google_sub: Mapped[str] = mapped_column(String(255), unique=True)
    learner_id: Mapped[str] = mapped_column(ForeignKey("learners.id"))
    created: Mapped[float] = mapped_column(Float, default=time.time)


class GroupMove(Base):
    __tablename__ = "group_moves"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    learner_id: Mapped[str] = mapped_column(ForeignKey("learners.id"), index=True)
    admin_id: Mapped[str] = mapped_column(ForeignKey("learners.id"))
    previous_groups: Mapped[str] = mapped_column(Text)
    group_id: Mapped[str | None] = mapped_column(ForeignKey("cohorts.id"), nullable=True)
    created: Mapped[float] = mapped_column(Float, default=time.time)


class ExecutionRecord(Base):
    __tablename__ = "execution_records"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    learner_id: Mapped[str] = mapped_column(ForeignKey("learners.id"), index=True)
    step_id: Mapped[str] = mapped_column(String(200))
    version: Mapped[str] = mapped_column(String(80))
    code: Mapped[str] = mapped_column(Text)
    outcome: Mapped[bool | None] = mapped_column(Boolean, nullable=True)
    completed: Mapped[bool] = mapped_column(Boolean, default=False)
    created: Mapped[float] = mapped_column(Float, default=time.time)


class ContentRevision(Base):
    __tablename__ = "content_revisions"
    id: Mapped[str] = mapped_column(String(36), primary_key=True, default=uid)
    block_id: Mapped[str] = mapped_column(String(300), index=True)
    author_id: Mapped[str] = mapped_column(ForeignKey("learners.id"))
    body: Mapped[str] = mapped_column(Text)
    base_hash: Mapped[str] = mapped_column(String(64))
    state: Mapped[str] = mapped_column(String(20), default="draft")
    created: Mapped[float] = mapped_column(Float, default=time.time)
