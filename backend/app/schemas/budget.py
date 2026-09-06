from pydantic import BaseModel, ConfigDict, Field

class BudgetBase(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    limit_amount: float = Field(gt=0)
    month_year: str = Field(pattern=r"^\d{4}-\d{2}$")

class BudgetCreate(BudgetBase):
    pass

class BudgetUpdate(BudgetBase):
    pass

class BudgetOut(BudgetBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int

class BudgetProgress(BaseModel):
    id: int
    category: str
    limit_amount: float
    spent: float
    remaining: float
    percentage: float
    month_year: str

class AnnualBudgetCreate(BaseModel):
    category: str = Field(min_length=1, max_length=100)
    year: int = Field(ge=2020, le=2100)
    annual_budget: float = Field(gt=0)
    allocations: dict[str, float] = Field(default_factory=dict)
