from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.crud.income import create_income, delete_income, get_income, get_incomes_by_user, update_income
from app.database import get_db
from app.models.bank_account import BankAccount
from app.models.user import User
from app.schemas.income import IncomeCreate, IncomeOut, IncomeUpdate

router = APIRouter(prefix="/income", tags=["Income"])

def check_account(db, user_id, account_id):
    if account_id is None: return None
    account = db.query(BankAccount).filter(BankAccount.id == account_id, BankAccount.user_id == user_id).first()
    if not account: raise HTTPException(400, "Selected bank account does not belong to you")
    return account

@router.post("/", response_model=IncomeOut, status_code=201)
def add_income(data: IncomeCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    account = check_account(db, current_user.id, data.bank_account_id)
    if data.payment_method.lower() in ("bank account", "bank") and not account:
        raise HTTPException(400, "Select a bank account for bank payments")
    obj = create_income(db, current_user.id, data)
    if account:
        account.balance += data.amount
        db.commit()
    return obj

@router.get("/", response_model=list[IncomeOut])
def list_income(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_incomes_by_user(db, current_user.id, skip, min(limit, 200))

@router.get("/{income_id}", response_model=IncomeOut)
def get_one(income_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_income(db, income_id, current_user.id)
    if not obj: raise HTTPException(404, "Income not found")
    return obj

@router.put("/{income_id}", response_model=IncomeOut)
def update(income_id: int, data: IncomeUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_income(db, income_id, current_user.id)
    if not obj: raise HTTPException(404, "Income not found")
    old_account = check_account(db, current_user.id, obj.bank_account_id)
    new_account = check_account(db, current_user.id, data.bank_account_id)
    if data.payment_method.lower() in ("bank account", "bank") and not new_account:
        raise HTTPException(400, "Select a bank account for bank payments")
    if old_account: old_account.balance -= obj.amount
    if new_account: new_account.balance += data.amount
    return update_income(db, obj, data)

@router.delete("/{income_id}")
def remove(income_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_income(db, income_id, current_user.id)
    if not obj: raise HTTPException(404, "Income not found")
    account = check_account(db, current_user.id, obj.bank_account_id)
    if account: account.balance -= obj.amount
    delete_income(db, obj)
    return {"message": "Income deleted successfully"}
