from datetime import date
from pydantic import BaseModel, ConfigDict, Field

class IncomeBase(BaseModel):
    source: str = Field(min_length=1, max_length=100)
    amount: float = Field(gt=0)
    description: str | None = Field(default=None, max_length=255)
    date: date
    payment_method: str = Field(default="Cash", max_length=50)
    bank_account_id: int | None = None

class IncomeCreate(IncomeBase):
    pass

class IncomeUpdate(IncomeBase):
    pass

class IncomeOut(IncomeBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
