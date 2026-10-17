"""Profiles, trusted execution receipts and versioned prose overrides."""

import sqlalchemy as sa
from alembic import op

revision = "20261017_learning"
down_revision = "20261016_admin_no_groups"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("learners", sa.Column("full_name", sa.String(80), nullable=True))
    op.add_column("learners", sa.Column("birth_date", sa.Date(), nullable=True))
    op.add_column("learners", sa.Column("avatar_id", sa.String(20), nullable=True))
    from backend.models import ContentRevision, ExecutionRecord

    ExecutionRecord.__table__.create(op.get_bind())
    ContentRevision.__table__.create(op.get_bind())


def downgrade():
    # Preserve collected profiles, execution evidence and editorial history.
    pass
