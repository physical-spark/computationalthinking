"""Add private uploaded avatars without changing existing profiles."""

import sqlalchemy as sa
from alembic import op

revision = "20261017_avatars"
down_revision = "20261017_learning"
branch_labels = None
depends_on = None


def upgrade():
    op.add_column("learners", sa.Column("avatar_version", sa.String(64), nullable=True))
    op.create_table(
        "profile_images",
        sa.Column("learner_id", sa.String(36), sa.ForeignKey("learners.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("image", sa.LargeBinary(), nullable=False),
    )


def downgrade():
    # App rollback preserves uploaded images and existing records.
    pass
