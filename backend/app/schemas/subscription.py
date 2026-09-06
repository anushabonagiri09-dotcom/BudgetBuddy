from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field

class SubscriptionRequestCreate(BaseModel):
    requested_role: str = Field(default="premium", pattern=r"^premium$")

class SubscriptionRequestOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    user_id: int
    requested_role: str
    status: str
    requested_at: datetime
    reviewed_at: datetime | None = None
    reviewed_by: int | None = None

class SubscriptionDecision(BaseModel):
    action: str = Field(pattern=r"^(approve|reject)$")
