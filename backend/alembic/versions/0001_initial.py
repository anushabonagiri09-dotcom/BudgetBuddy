from alembic import op
import sqlalchemy as sa

revision = "0001_initial"
down_revision = None
branch_labels = None
depends_on = None

def fk(table, user=True, bank=False):
    cols = []
    if user:
        cols.append(sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False))
    return cols

def upgrade():
    op.create_table(
        "users",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("email", sa.String(255), nullable=False, unique=True),
        sa.Column("hashed_password", sa.String(255), nullable=False),
        sa.Column("role", sa.String(30), nullable=False, server_default="student"),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_users_id", "users", ["id"])

    op.create_table(
        "profiles",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("monthly_income", sa.Float(), nullable=False, server_default="0"),
        sa.Column("currency", sa.String(10), nullable=False, server_default="INR"),
    )
    op.create_table(
        "bank_accounts",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("bank_name", sa.String(100), nullable=False),
        sa.Column("account_number", sa.String(30), nullable=False),
        sa.Column("account_type", sa.String(30), nullable=False, server_default="Savings"),
        sa.Column("balance", sa.Float(), nullable=False, server_default="0"),
    )
    op.create_table(
        "incomes",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("source", sa.String(100), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("description", sa.String(255)),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("payment_method", sa.String(50), nullable=False, server_default="Cash"),
        sa.Column("bank_account_id", sa.Integer(), sa.ForeignKey("bank_accounts.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "expenses",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("amount", sa.Float(), nullable=False),
        sa.Column("payment_method", sa.String(50), nullable=False, server_default="Cash"),
        sa.Column("description", sa.String(255)),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("bank_account_id", sa.Integer(), sa.ForeignKey("bank_accounts.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "budgets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("category", sa.String(100), nullable=False),
        sa.Column("limit_amount", sa.Float(), nullable=False),
        sa.Column("month_year", sa.String(7), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "savings_goals",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("title", sa.String(120), nullable=False),
        sa.Column("target_amount", sa.Float(), nullable=False),
        sa.Column("current_amount", sa.Float(), nullable=False, server_default="0"),
        sa.Column("target_date", sa.Date()),
        sa.Column("status", sa.String(30), nullable=False, server_default="in_progress"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_table(
        "notifications",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("message", sa.String(255), nullable=False),
        sa.Column("type", sa.String(50), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )

def downgrade():
    for table in ["notifications","savings_goals","budgets","expenses","incomes","bank_accounts","profiles","users"]:
        op.drop_table(table)
