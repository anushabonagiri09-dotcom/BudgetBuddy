from pydantic import BaseModel, ConfigDict, Field

class BankAccountCreate(BaseModel):
    bank_name: str = Field(min_length=1, max_length=100)
    account_number: str = Field(min_length=4, max_length=30)
    account_type: str = Field(default="Savings", max_length=30)
    balance: float = Field(default=0, ge=0)

class BankAccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    bank_name: str
    account_number: str
    account_type: str
    balance: float
