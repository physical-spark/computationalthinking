"""Add administrator identity binding and group movement history."""

import sqlalchemy as sa
from alembic import op

revision = "20261016_admin_groups"
down_revision = "d9c257389d3c"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "admin_claims",
        sa.Column("email_hash", sa.String(64), primary_key=True),
        sa.Column("google_sub", sa.String(255), nullable=False, unique=True),
        sa.Column("learner_id", sa.String(36), sa.ForeignKey("learners.id"), nullable=False),
        sa.Column("created", sa.Float(), nullable=False),
    )
    op.create_table(
        "group_moves",
        sa.Column("id", sa.String(36), primary_key=True),
        sa.Column("learner_id", sa.String(36), sa.ForeignKey("learners.id"), nullable=False),
        sa.Column("admin_id", sa.String(36), sa.ForeignKey("learners.id"), nullable=False),
        sa.Column("previous_groups", sa.Text(), nullable=False),
        sa.Column("group_id", sa.String(36), sa.ForeignKey("cohorts.id"), nullable=True),
        sa.Column("created", sa.Float(), nullable=False),
    )
    op.create_index("ix_group_moves_learner_id", "group_moves", ["learner_id"])


def downgrade():
    op.drop_table("group_moves")
    op.drop_table("admin_claims")
