from datetime import date, datetime
from pydantic import BaseModel, ConfigDict, Field

class SavingsGoalBase(BaseModel):
    title: str = Field(min_length=1, max_length=120)
    target_amount: float = Field(gt=0)
    current_amount: float = Field(default=0, ge=0)
    target_date: date | None = None

class SavingsGoalCreate(SavingsGoalBase):
    pass

class SavingsGoalUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=120)
    target_amount: float | None = Field(default=None, gt=0)
    target_date: date | None = None

class SavingsGoalOut(SavingsGoalBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    status: str
    created_at: datetime

class Contribution(BaseModel):
    amount: float = Field(gt=0)
