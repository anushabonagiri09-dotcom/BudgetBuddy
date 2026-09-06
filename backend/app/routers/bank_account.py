from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.crud.bank_account import create_bank_account, delete_bank_account, get_bank_account, get_bank_accounts
from app.database import get_db
from app.models.user import User
from app.schemas.bank_account import BankAccountCreate, BankAccountOut

router = APIRouter(prefix="/bank-account", tags=["Bank Accounts"])

def safe_account(obj):
    return {
        "id": obj.id,
        "user_id": obj.user_id,
        "bank_name": obj.bank_name,
        "account_number": f"••••{obj.account_number[-4:]}",
        "account_type": obj.account_type,
        "balance": obj.balance,
    }

@router.post("/", response_model=BankAccountOut, status_code=201)
def add_account(data: BankAccountCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return safe_account(create_bank_account(db, current_user.id, data))

@router.get("/", response_model=list[BankAccountOut])
def list_accounts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return [safe_account(x) for x in get_bank_accounts(db, current_user.id)]

@router.delete("/{account_id}")
def remove_account(account_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_bank_account(db, account_id, current_user.id)
    if not obj:
        raise HTTPException(404, "Bank account not found")
    delete_bank_account(db, obj)
    return {"message": "Bank account deleted successfully"}
