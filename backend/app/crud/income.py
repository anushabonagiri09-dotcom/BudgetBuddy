from sqlalchemy.orm import Session
from app.models.income import Income
from app.schemas.income import IncomeCreate, IncomeUpdate

def create_income(db: Session, user_id: int, data: IncomeCreate):
    obj = Income(user_id=user_id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_incomes_by_user(db: Session, user_id: int, skip=0, limit=100):
    return (db.query(Income).filter(Income.user_id == user_id)
            .order_by(Income.date.desc(), Income.id.desc()).offset(skip).limit(limit).all())

def get_income(db: Session, income_id: int, user_id: int):
    return db.query(Income).filter(Income.id == income_id, Income.user_id == user_id).first()

def update_income(db: Session, obj: Income, data: IncomeUpdate):
    for key, value in data.model_dump().items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj

def delete_income(db: Session, obj: Income):
    db.delete(obj)
    db.commit()
