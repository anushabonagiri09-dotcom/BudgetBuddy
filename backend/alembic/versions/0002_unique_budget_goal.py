from alembic import op

revision = "0002_unique_budget_goal"
down_revision = "0001_initial"
branch_labels = None
depends_on = None

def upgrade():
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_savings_goal_user_title ON savings_goals (user_id, title)")
    op.execute("CREATE UNIQUE INDEX IF NOT EXISTS uq_budget_user_category_month ON budgets (user_id, category, month_year)")

def downgrade():
    op.execute("DROP INDEX IF EXISTS uq_budget_user_category_month")
    op.execute("DROP INDEX IF EXISTS uq_savings_goal_user_title")
