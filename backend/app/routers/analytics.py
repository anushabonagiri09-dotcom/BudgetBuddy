from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.analytics import (
    analytics_summary, monthly_trend, savings_progress, spending_by_category, category_trend
)
from app.database import get_db
from app.models.user import User
from app.models.savings_goal import SavingsGoal
from app.models.income import Income
from app.models.expense import Expense
from sqlalchemy import func
from app.schemas.analytics import AnalyticsSummary, CategoryPoint, CategoryTrendPoint, GoalProgress, MonthlyPoint

router = APIRouter(prefix="/analytics", tags=["Analytics"])


def effective_range(current_user, start_date, end_date):
    # Default users are restricted to the current month; premium/admin may
    # request a custom range.
    if current_user.role not in ("premium", "admin"):
        today = date.today()
        start_date = date(today.year, today.month, 1)
        from calendar import monthrange
        end_date = date(today.year, today.month, monthrange(today.year, today.month)[1])
    if start_date and end_date and start_date > end_date:
        raise HTTPException(400, "start_date cannot be after end_date")
    return start_date, end_date


@router.get("/spending-by-category", response_model=list[CategoryPoint])
def spending(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, end_date = effective_range(current_user, start_date, end_date)
    return spending_by_category(db, current_user.id, start_date, end_date)


@router.get("/monthly-trend", response_model=list[MonthlyPoint])
def trend(
    months: int = Query(6, ge=1, le=12),
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, end_date = effective_range(current_user, start_date, end_date)
    # Basic users get the current month only.
    if current_user.role not in ("premium", "admin"):
        months = 1
    return monthly_trend(db, current_user.id, months, start_date, end_date)


@router.get("/category-trend", response_model=list[CategoryTrendPoint])
def category_history(
    months: int = Query(6, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in ("premium", "admin"):
        raise HTTPException(403, "Category history is available to Premium and Admin users.")
    return category_trend(db, current_user.id, months)


@router.get("/savings-progress", response_model=list[GoalProgress])
def goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return savings_progress(db, current_user.id)


@router.get("/summary", response_model=AnalyticsSummary)
def summary(
    start_date: date | None = Query(None),
    end_date: date | None = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date, end_date = effective_range(current_user, start_date, end_date)
    return analytics_summary(db, current_user.id, start_date, end_date)


@router.get("/system")
def system_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin access required.")
    users = db.query(func.count(User.id)).scalar() or 0
    income = db.query(func.sum(Income.amount)).scalar() or 0
    expense = db.query(func.sum(Expense.amount)).scalar() or 0
    goals = db.query(func.count(SavingsGoal.id)).scalar() or 0
    completed = db.query(func.count(SavingsGoal.id)).filter(SavingsGoal.status == "completed").scalar() or 0
    return {
        "users": int(users),
        "total_income": float(income),
        "total_expense": float(expense),
        "net_balance": float(income - expense),
        "goals": int(goals),
        "completed_goals": int(completed),
    }
