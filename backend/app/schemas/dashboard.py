from pydantic import BaseModel

class DashboardResponse(BaseModel):
    total_income: float
    total_expense: float
    total_savings: float
    balance: float
    available_balance: float
    savings_rate: float
    expense_summary: list[dict]
    recent_transactions: list[dict]
