from sqlalchemy.orm import Session
from app.models.bank_account import BankAccount
from app.schemas.bank_account import BankAccountCreate

def create_bank_account(db: Session, user_id: int, data: BankAccountCreate):
    obj = BankAccount(user_id=user_id, **data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj

def get_bank_accounts(db: Session, user_id: int):
    return db.query(BankAccount).filter(BankAccount.user_id == user_id).order_by(BankAccount.id.desc()).all()

def get_bank_account(db: Session, account_id: int, user_id: int):
    return db.query(BankAccount).filter(BankAccount.id == account_id, BankAccount.user_id == user_id).first()

def delete_bank_account(db: Session, account: BankAccount):
    db.delete(account)
    db.commit()
