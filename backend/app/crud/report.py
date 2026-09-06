from datetime import date
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.expense import Expense
from app.models.income import Income

def monthly_report(db: Session, user_id: int, month: int, year: int):
    start = date(year, month, 1)
    end = date(year + (month == 12), 1 if month == 12 else month + 1, 1)
    income = db.query(func.sum(Income.amount)).filter(Income.user_id == user_id, Income.date >= start, Income.date < end).scalar() or 0
    expense = db.query(func.sum(Expense.amount)).filter(Expense.user_id == user_id, Expense.date >= start, Expense.date < end).scalar() or 0
    categories = db.query(Expense.category, func.sum(Expense.amount).label("total")).filter(
        Expense.user_id == user_id, Expense.date >= start, Expense.date < end
    ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()
    return {
        "month": f"{year}-{month:02d}", "total_income": float(income),
        "total_expense": float(expense), "balance": float(income-expense),
        "categories": [{"category": x.category, "total": float(x.total)} for x in categories]
    }
