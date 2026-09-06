from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.crud.user import create_user, get_user_by_email
from app.database import get_db
from app.models.profile import Profile
from app.models.subscription import SubscriptionRequest
from app.models.user import User
from app.schemas.user import (
    ChangePasswordRequest,
    DeleteAccountRequest,
    ProfileUpdate,
    RoleUpdate,
    Token,
    UserCreate,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def serialize_user(user: User):
    profile = user.profile
    return {
        "id": user.id,
        "email": user.email,
        "role": user.role,
        "full_name": profile.full_name if profile else None,
        "phone": profile.phone if profile else None,
        "monthly_income": float(profile.monthly_income or 0) if profile else 0.0,
        "currency": profile.currency if profile else "INR",
        "created_at": user.created_at.isoformat() if user.created_at else None,
    }


@router.post("/signup", response_model=UserOut, status_code=201)
def signup(data: UserCreate, db: Session = Depends(get_db)):
    if get_user_by_email(db, data.email):
        raise HTTPException(400, "Email already registered")
    user = create_user(db, data.email, data.password, data.full_name)
    return serialize_user(user)


@router.post("/login", response_model=Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = get_user_by_email(db, form_data.username)
    if not user or not verify_password(form_data.password, user.hashed_password):
        raise HTTPException(401, "Invalid email or password")
    token = create_access_token({"sub": user.email, "role": user.role})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return serialize_user(current_user)


@router.put("/profile", response_model=UserOut)
def update_profile(
    data: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = current_user.profile
    if not profile:
        profile = Profile(user_id=current_user.id, full_name=data.full_name.strip())
        db.add(profile)

    cleaned_phone = data.phone.strip() if data.phone else None
    profile.full_name = data.full_name.strip()
    profile.phone = cleaned_phone
    profile.monthly_income = float(data.monthly_income)
    profile.currency = data.currency.upper().strip()

    db.commit()
    db.refresh(current_user)
    return serialize_user(current_user)


@router.post("/change-password")
def change_password(
    data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(400, "Current password is incorrect")
    if data.current_password == data.new_password:
        raise HTTPException(400, "New password must be different from the current password")

    current_user.hashed_password = hash_password(data.new_password)
    db.commit()
    return {"message": "Password changed successfully"}


@router.delete("/account")
def delete_account(
    data: DeleteAccountRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if not verify_password(data.password, current_user.hashed_password):
        raise HTTPException(401, "Incorrect password")
    db.delete(current_user)
    db.commit()
    return {"message": "Account deleted successfully"}


@router.get("/users", response_model=list[UserOut])
def admin_users(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin access required.")
    users = db.query(User).order_by(User.id.desc()).all()
    return [serialize_user(item) for item in users]


@router.patch("/users/{user_id}/role", response_model=UserOut)
def update_user_role(
    user_id: int,
    data: RoleUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin access required.")
    if user_id == current_user.id:
        raise HTTPException(400, "Your own administrator role cannot be changed here.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found.")

    target.role = data.role

    if data.role == "premium":
        pending = db.query(SubscriptionRequest).filter(
            SubscriptionRequest.user_id == target.id,
            SubscriptionRequest.status == "pending",
        ).all()
        for item in pending:
            item.status = "approved"
            item.reviewed_at = datetime.utcnow()
            item.reviewed_by = current_user.id

    db.commit()
    db.refresh(target)
    return serialize_user(target)

@router.delete("/users/{user_id}")
def delete_user(
    user_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete another user account and all user-owned financial data."""
    if current_user.role != "admin":
        raise HTTPException(403, "Admin access required.")

    if user_id == current_user.id:
        raise HTTPException(400, "You cannot delete your own administrator account here.")

    target = db.query(User).filter(User.id == user_id).first()
    if not target:
        raise HTTPException(404, "User not found.")

    # SubscriptionRequest has no ORM relationship on User, so clean it up
    # explicitly before deleting the account. Reviewer references are nullable.
    db.query(SubscriptionRequest).filter(
        SubscriptionRequest.user_id == target.id
    ).delete(synchronize_session=False)

    db.query(SubscriptionRequest).filter(
        SubscriptionRequest.reviewed_by == target.id
    ).update(
        {SubscriptionRequest.reviewed_by: None},
        synchronize_session=False,
    )

    db.delete(target)
    db.commit()

    return {
        "message": "User account deleted successfully.",
        "user_id": user_id,
    }

