from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.income import Income
from app.models.expense import Expense
from app.models.savings_goal import SavingsGoal


def get_total_income(db: Session, user_id: int) -> float:
    return float(db.query(func.sum(Income.amount)).filter(Income.user_id == user_id).scalar() or 0)


def get_total_expenses(db: Session, user_id: int) -> float:
    return float(db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id).scalar() or 0)


def get_total_savings(db: Session, user_id: int) -> float:
    return float(db.query(func.sum(SavingsGoal.current_amount)).filter(SavingsGoal.user_id == user_id).scalar() or 0)


def get_available_balance(db: Session, user_id: int) -> float:
    return round(get_total_income(db, user_id) - get_total_expenses(db, user_id) - get_total_savings(db, user_id), 2)
