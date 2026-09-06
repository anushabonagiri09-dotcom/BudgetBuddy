from datetime import date
from calendar import monthrange
from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.expense import Expense
from app.models.income import Income
from app.crud.finance import get_total_savings, get_available_balance

def month_range(year, month):
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)
    return start, end

def get_dashboard_data(db: Session, user_id: int):
    today = date.today()
    start, end = month_range(today.year, today.month)

    total_income = db.query(func.sum(Income.amount)).filter(
        Income.user_id == user_id, Income.date >= start, Income.date < end
    ).scalar() or 0
    total_expense = db.query(func.sum(Expense.amount)).filter(
        Expense.user_id == user_id, Expense.date >= start, Expense.date < end
    ).scalar() or 0

    summary = db.query(Expense.category, func.sum(Expense.amount).label("total")).filter(
        Expense.user_id == user_id, Expense.date >= start, Expense.date < end
    ).group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all()

    incomes = db.query(Income).filter(Income.user_id == user_id).order_by(Income.date.desc(), Income.id.desc()).limit(10).all()
    expenses = db.query(Expense).filter(Expense.user_id == user_id).order_by(Expense.date.desc(), Expense.id.desc()).limit(10).all()
    transactions = (
        [{"type":"Income","title":x.source,"amount":x.amount,"date":x.date} for x in incomes] +
        [{"type":"Expense","title":x.category,"amount":x.amount,"date":x.date} for x in expenses]
    )
    transactions.sort(key=lambda x: x["date"], reverse=True)
    savings_rate = round(((total_income-total_expense)/total_income)*100, 1) if total_income else 0
    available_balance = get_available_balance(db, user_id)
    total_savings = get_total_savings(db, user_id)
    return {
        "total_income": float(total_income),
        "total_expense": float(total_expense),
        "balance": available_balance,
        "total_savings": total_savings,
        "available_balance": available_balance,
        "savings_rate": round((get_total_savings(db, user_id) / total_income) * 100, 1) if total_income else 0,
        "expense_summary": [{"category":x.category,"total":float(x.total)} for x in summary],
        "recent_transactions": transactions[:5],
    }
