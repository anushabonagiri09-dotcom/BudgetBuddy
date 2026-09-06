from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    full_name: str = Field(min_length=2, max_length=120)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    email: EmailStr
    role: str
    full_name: str | None = None
    phone: str | None = None
    monthly_income: float = 0.0
    currency: str = "INR"
    created_at: str | None = None


class Token(BaseModel):
    access_token: str
    token_type: str


class DeleteAccountRequest(BaseModel):
    password: str


class RoleUpdate(BaseModel):
    role: str = Field(pattern=r"^(student|premium|admin)$")


class ProfileUpdate(BaseModel):
    full_name: str = Field(min_length=2, max_length=120)
    phone: str | None = Field(default=None, max_length=30)
    monthly_income: float = Field(default=0, ge=0)
    currency: str = Field(default="INR", min_length=3, max_length=10)


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(min_length=1, max_length=72)
    new_password: str = Field(min_length=6, max_length=72)
