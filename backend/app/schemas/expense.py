from datetime import date
from pydantic import BaseModel, ConfigDict, Field

CATEGORIES = ["Food", "Travel", "Shopping", "Education", "Entertainment", "Medical", "Bills", "Other"]

class ExpenseBase(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    description: str | None = Field(default=None, max_length=255)
    date: date
    payment_method: str = Field(default="Cash", max_length=50)
    bank_account_id: int | None = None

class ExpenseCreate(ExpenseBase):
    pass

class ExpenseUpdate(ExpenseBase):
    pass

class ExpenseOut(ExpenseBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int

class ExpenseSummary(BaseModel):
    category: str
    total: float
