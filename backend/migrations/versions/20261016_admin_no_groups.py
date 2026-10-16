"""Remove administrator group memberships, preserving group-move history."""

import json
import time
import uuid

import sqlalchemy as sa
from alembic import op

revision = "20261016_admin_no_groups"
down_revision = "20261016_admin_groups"
branch_labels = None
depends_on = None


def upgrade():
    conn = op.get_bind()
    old = conn.execute(
        sa.text(
            "SELECT m.learner_id, m.cohort_id FROM memberships m JOIN learners l ON l.id=m.learner_id WHERE l.admin=true"
        )
    ).all()
    groups = {}
    for learner, cohort in old:
        groups.setdefault(learner, []).append(cohort)
    for learner, memberships in groups.items():
        conn.execute(
            sa.text(
                "INSERT INTO group_moves (id,learner_id,admin_id,previous_groups,group_id,created) VALUES (:id,:uid,:uid,:old,NULL,:now)"
            ),
            {
                "id": str(uuid.uuid4()),
                "uid": learner,
                "old": json.dumps(memberships),
                "now": time.time(),
            },
        )
    conn.execute(
        sa.text(
            "DELETE FROM memberships WHERE learner_id IN (SELECT id FROM learners WHERE admin=true)"
        )
    )


def downgrade():
    # Group history remains available; never silently restore obsolete memberships.
    pass
