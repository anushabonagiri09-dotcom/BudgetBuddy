from calendar import month_name
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.models.user import User
from app.models.income import Income
from app.models.expense import Expense
from app.models.budget import Budget
from app.models.bank_account import BankAccount
from app.models.savings_goal import SavingsGoal

router = APIRouter(prefix="/admin/financials", tags=["Admin Financial Overview"])


def require_admin(current_user: User):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required.")


def user_name(user):
    return user.profile.full_name if user and user.profile else (user.email if user else "Unknown user")


@router.get("")
def financial_overview(
    user_id: int | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Administrator financial workspace.

    Data isolation: this endpoint never returns individual transactions
    (no income source, expense description, exact dates, or bank account
    numbers for a specific record). It only returns aggregate, per-user
    totals -- the same level of detail a real-world admin panel exposes.
    Anyone wanting a specific user's line-item history must use that
    user's own account.
    """
    require_admin(current_user)

    today = date.today()
    month_start = date(today.year, today.month, 1)
    if today.month == 12:
        month_end = date(today.year + 1, 1, 1)
    else:
        month_end = date(today.year, today.month + 1, 1)
    current_month_year = f"{today.year:04d}-{today.month:02d}"

    users_query = db.query(User).order_by(User.id.desc())
    if user_id is not None:
        target = users_query.filter(User.id == user_id).first()
        if not target:
            raise HTTPException(status_code=404, detail="User not found.")
        users = [target]
    else:
        users = users_query.all()

    user_ids = {u.id for u in users}

    all_incomes = db.query(Income).filter(Income.user_id.in_(user_ids)).all() if user_ids else []
    all_expenses = db.query(Expense).filter(Expense.user_id.in_(user_ids)).all() if user_ids else []
    all_budgets = db.query(Budget).filter(Budget.user_id.in_(user_ids)).all() if user_ids else []
    all_banks = db.query(BankAccount).filter(BankAccount.user_id.in_(user_ids)).all() if user_ids else []
    all_goals = db.query(SavingsGoal).filter(SavingsGoal.user_id.in_(user_ids)).all() if user_ids else []

    user_summary = []
    for u in users:
        month_income = sum(float(x.amount or 0) for x in all_incomes if x.user_id == u.id and x.date and month_start <= x.date < month_end)
        month_expense = sum(float(x.amount or 0) for x in all_expenses if x.user_id == u.id and x.date and month_start <= x.date < month_end)
        all_income = sum(float(x.amount or 0) for x in all_incomes if x.user_id == u.id)
        all_expense = sum(float(x.amount or 0) for x in all_expenses if x.user_id == u.id)
        user_budgets = [x for x in all_budgets if x.user_id == u.id]
        user_banks = [x for x in all_banks if x.user_id == u.id]
        user_summary.append({
            "id": u.id, "name": user_name(u), "email": u.email, "role": u.role,
            "monthly_income": month_income, "monthly_expense": month_expense,
            "monthly_balance": month_income - month_expense,
            "total_income": all_income, "total_expense": all_expense,
            "total_balance": all_income - all_expense,
            "income_count": sum(1 for x in all_incomes if x.user_id == u.id),
            "expense_count": sum(1 for x in all_expenses if x.user_id == u.id),
            "budget_count": len(user_budgets),
            "current_month_budget": sum(float(x.limit_amount or 0) for x in user_budgets if x.month_year == current_month_year),
            "bank_account_count": len(user_banks),
            "bank_balance": sum(float(x.balance or 0) for x in user_banks),
            "goal_count": sum(1 for x in all_goals if x.user_id == u.id),
        })

    month_income = sum(row["monthly_income"] for row in user_summary)
    month_expense = sum(row["monthly_expense"] for row in user_summary)
    all_income_total = sum(row["total_income"] for row in user_summary)
    all_expense_total = sum(row["total_expense"] for row in user_summary)
    total_budget = sum(row["current_month_budget"] for row in user_summary)

    grouped = {}
    for item in all_expenses:
        if item.date and month_start <= item.date < month_end:
            key = item.category or "Other"
            grouped[key] = grouped.get(key, 0) + float(item.amount or 0)

    available_users = [
        {"id": u.id, "name": user_name(u), "email": u.email, "role": u.role}
        for u in db.query(User).order_by(User.id.desc()).all()
    ]

    return {
        "privacy_mode": "aggregate_totals_only_no_individual_transactions",
        "period": current_month_year,
        "period_label": f"{month_name[today.month]} {today.year}",
        "selected_user": (
            {"id": users[0].id, "name": user_name(users[0]), "email": users[0].email, "role": users[0].role}
            if user_id is not None and users else None
        ),
        "available_users": available_users,
        "summary": {
            "users": len(users), "total_users": db.query(User).count(),
            "premium_users": db.query(User).filter(User.role == "premium").count(),
            "standard_users": db.query(User).filter(User.role == "student").count(),
            "admin_users": db.query(User).filter(User.role == "admin").count(),
            "income_count": sum(row["income_count"] for row in user_summary),
            "expense_count": sum(row["expense_count"] for row in user_summary),
            "budget_count": sum(row["budget_count"] for row in user_summary),
            "total_budget": total_budget,
            "bank_account_count": sum(row["bank_account_count"] for row in user_summary),
            "total_bank_balance": sum(row["bank_balance"] for row in user_summary),
            "goal_count": sum(row["goal_count"] for row in user_summary),
            "total_income": month_income, "total_expense": month_expense,
            "net_balance": month_income - month_expense,
            "all_time_income": all_income_total, "all_time_expense": all_expense_total,
            "expense_categories": [{"category": k, "total": v} for k, v in sorted(grouped.items(), key=lambda x: x[1], reverse=True)],
        },
        "user_summary": user_summary,
    }
