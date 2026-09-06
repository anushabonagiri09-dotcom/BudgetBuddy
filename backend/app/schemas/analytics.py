from pydantic import BaseModel

class CategoryPoint(BaseModel):
    category: str
    total: float

class MonthlyPoint(BaseModel):
    month: str
    income: float
    expense: float

class GoalProgress(BaseModel):
    id: int
    title: str
    target_amount: float
    current_amount: float
    percentage: float
    status: str

class AnalyticsSummary(BaseModel):
    total_income: float
    total_expense: float
    balance: float
    total_savings: float
    available_balance: float
    savings_rate: float
    active_goals: int
    completed_goals: int

class CategoryTrendPoint(BaseModel):
    month: str
    category: str
    total: float
