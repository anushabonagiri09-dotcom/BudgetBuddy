from alembic import op
import sqlalchemy as sa

revision = "0003_subscription_requests"
down_revision = "0002_unique_budget_goal"
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        "subscription_requests",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("requested_role", sa.String(30), nullable=False, server_default="premium"),
        sa.Column("status", sa.String(20), nullable=False, server_default="pending"),
        sa.Column("requested_at", sa.DateTime(), nullable=False),
        sa.Column("reviewed_at", sa.DateTime(), nullable=True),
        sa.Column("reviewed_by", sa.Integer(), sa.ForeignKey("users.id", ondelete="SET NULL"), nullable=True),
    )
    op.create_index("ix_subscription_requests_id", "subscription_requests", ["id"])
    op.create_index("ix_subscription_requests_user_id", "subscription_requests", ["user_id"])
    op.create_index("ix_subscription_requests_status", "subscription_requests", ["status"])


def downgrade():
    op.drop_index("ix_subscription_requests_status", table_name="subscription_requests")
    op.drop_index("ix_subscription_requests_user_id", table_name="subscription_requests")
    op.drop_index("ix_subscription_requests_id", table_name="subscription_requests")
    op.drop_table("subscription_requests")
