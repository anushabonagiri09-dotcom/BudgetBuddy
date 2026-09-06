from calendar import monthrange
from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.crud.finance import get_available_balance, get_total_savings
from app.models.expense import Expense
from app.models.income import Income
from app.models.savings_goal import SavingsGoal


def _range(start_date: date | None, end_date: date | None):
    if start_date and end_date and start_date > end_date:
        raise ValueError("start_date cannot be after end_date")
    return start_date, end_date


def _filters(query, model, user_id, start_date=None, end_date=None):
    query = query.filter(model.user_id == user_id)
    if start_date:
        query = query.filter(model.date >= start_date)
    if end_date:
        query = query.filter(model.date <= end_date)
    return query


def month_start_offset(year: int, month: int, offset: int) -> date:
    total = year * 12 + (month - 1) + offset
    y, m0 = divmod(total, 12)
    return date(y, m0 + 1, 1)


def spending_by_category(db: Session, user_id: int, start_date=None, end_date=None):
    _range(start_date, end_date)
    q = _filters(db.query(Expense.category, func.sum(Expense.amount).label("total")),
                 Expense, user_id, start_date, end_date)
    rows = q.group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()
    return [{"category": r.category, "total": float(r.total)} for r in rows]


def monthly_trend(db: Session, user_id: int, months: int = 6, start_date=None, end_date=None):
    if months < 1 or months > 12:
        raise ValueError("months must be between 1 and 12")
    today = date.today()
    if end_date:
        anchor = end_date
    else:
        anchor = today
    result = []
    for i in range(months - 1, -1, -1):
        start = month_start_offset(anchor.year, anchor.month, -i)
        end = month_start_offset(start.year, start.month, 1)
        # month_start_offset(..., 1) is the first day of the following month
        income_q = db.query(func.sum(Income.amount))
        expense_q = db.query(func.sum(Expense.amount))
        income_q = income_q.filter(Income.user_id == user_id, Income.date >= start, Income.date < end)
        expense_q = expense_q.filter(Expense.user_id == user_id, Expense.date >= start, Expense.date < end)
        if start_date:
            income_q = income_q.filter(Income.date >= start_date)
            expense_q = expense_q.filter(Expense.date >= start_date)
        if end_date:
            income_q = income_q.filter(Income.date <= end_date)
            expense_q = expense_q.filter(Expense.date <= end_date)
        result.append({
            "month": start.strftime("%Y-%m"),
            "income": float(income_q.scalar() or 0),
            "expense": float(expense_q.scalar() or 0),
        })
    return result


def savings_progress(db: Session, user_id: int):
    goals = db.query(SavingsGoal).filter(
        SavingsGoal.user_id == user_id
    ).order_by(SavingsGoal.id.desc()).all()
    return [{
        "id": g.id,
        "title": g.title,
        "target_amount": float(g.target_amount),
        "current_amount": float(g.current_amount),
        "percentage": round(min((g.current_amount / g.target_amount) * 100, 100), 1)
        if g.target_amount else 0,
        "status": g.status,
    } for g in goals]


def analytics_summary(db: Session, user_id: int, start_date=None, end_date=None):
    _range(start_date, end_date)
    income_q = _filters(db.query(func.sum(Income.amount)), Income, user_id, start_date, end_date)
    expense_q = _filters(db.query(func.sum(Expense.amount)), Expense, user_id, start_date, end_date)
    income = float(income_q.scalar() or 0)
    expense = float(expense_q.scalar() or 0)

    # Savings goals and available balance are account-level figures, so they
    # intentionally remain user-scoped rather than being date-filtered.
    goals = db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).all()
    completed = sum(1 for g in goals if g.status == "completed")
    total_savings = get_total_savings(db, user_id)
    available_balance = get_available_balance(db, user_id)
    return {
        "total_income": income,
        "total_expense": expense,
        "balance": round(income - expense, 2),
        "total_savings": total_savings,
        "available_balance": available_balance,
        "savings_rate": round(((income - expense) / income) * 100, 1) if income else 0,
        "active_goals": len(goals) - completed,
        "completed_goals": completed,
    }


def category_trend(db: Session, user_id: int, months: int = 6):
    today = date.today()
    result = []
    for i in range(months - 1, -1, -1):
        start = month_start_offset(today.year, today.month, -i)
        end = month_start_offset(start.year, start.month, 1)
        rows = db.query(
            Expense.category,
            func.sum(Expense.amount).label("total")
        ).filter(
            Expense.user_id == user_id,
            Expense.date >= start,
            Expense.date < end,
        ).group_by(Expense.category).all()
        for row in rows:
            result.append({
                "month": start.strftime("%Y-%m"),
                "category": row.category,
                "total": float(row.total),
            })
    return result
