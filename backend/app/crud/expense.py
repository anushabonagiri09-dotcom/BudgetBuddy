from sqlalchemy import func
from sqlalchemy.orm import Session
from app.models.expense import Expense
from app.schemas.expense import ExpenseCreate, ExpenseUpdate

def create_expense(db: Session, user_id: int, data: ExpenseCreate):
    obj = Expense(user_id=user_id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_expenses_by_user(db: Session, user_id: int, skip=0, limit=100):
    return (db.query(Expense).filter(Expense.user_id == user_id)
            .order_by(Expense.date.desc(), Expense.id.desc()).offset(skip).limit(limit).all())

def get_expense(db: Session, expense_id: int, user_id: int):
    return db.query(Expense).filter(Expense.id == expense_id, Expense.user_id == user_id).first()

def update_expense(db: Session, obj: Expense, data: ExpenseUpdate):
    for key, value in data.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_expense(db: Session, obj: Expense):
    db.delete(obj)
    db.commit()

def get_expense_summary(db: Session, user_id: int):
    return (db.query(Expense.category, func.sum(Expense.amount).label("total"))
            .filter(Expense.user_id == user_id)
            .group_by(Expense.category).order_by(func.sum(Expense.amount).desc()).all())

def get_month_category_spent(db: Session, user_id: int, category: str, month_start, month_end):
    return (db.query(func.sum(Expense.amount))
            .filter(Expense.user_id == user_id, Expense.category == category,
                    Expense.date >= month_start, Expense.date < month_end).scalar() or 0)
