from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.database import get_db
from app.crud.notification import create_notification
from app.models.notification import Notification
from app.models.subscription import SubscriptionRequest
from app.models.user import User
from app.schemas.subscription import SubscriptionDecision, SubscriptionRequestCreate

router = APIRouter(prefix="/subscriptions", tags=["Subscriptions"])


def serialize(item, db):
    user = db.query(User).filter(User.id == item.user_id).first()
    return {
        "id": item.id,
        "user_id": item.user_id,
        "user_name": user.profile.full_name if user and user.profile else None,
        "user_email": user.email if user else None,
        "requested_role": item.requested_role,
        "status": item.status,
        "requested_at": item.requested_at,
        "reviewed_at": item.reviewed_at,
        "reviewed_by": item.reviewed_by,
    }


@router.post("/request")
def request_premium(data: SubscriptionRequestCreate, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role == "premium":
        raise HTTPException(400, "Your account is already Premium.")
    if current_user.role == "admin":
        raise HTTPException(400, "Administrators already have full access.")
    pending = db.query(SubscriptionRequest).filter(
        SubscriptionRequest.user_id == current_user.id,
        SubscriptionRequest.status == "pending",
    ).first()
    if pending:
        raise HTTPException(409, "Your Premium request is already pending.")

    item = SubscriptionRequest(user_id=current_user.id, requested_role="premium", status="pending")
    db.add(item)
    db.commit()
    db.refresh(item)

    display_name = current_user.profile.full_name if current_user.profile else current_user.email
    admins = db.query(User).filter(User.role == "admin", User.is_active == True).all()
    for admin in admins:
        create_notification(
            db,
            admin.id,
            f"New Premium request from {display_name} ({current_user.email}).",
            "premium_request",
        )

    return serialize(item, db)


@router.get("/mine")
def my_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    items = db.query(SubscriptionRequest).filter(
        SubscriptionRequest.user_id == current_user.id
    ).order_by(SubscriptionRequest.id.desc()).all()
    return [serialize(item, db) for item in items]


@router.get("/pending")
def pending_requests(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin access required.")
    items = db.query(SubscriptionRequest).filter(
        SubscriptionRequest.status == "pending"
    ).order_by(SubscriptionRequest.requested_at.asc()).all()
    return [serialize(item, db) for item in items]


@router.patch("/{request_id}")
def decide_request(request_id: int, data: SubscriptionDecision, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    if current_user.role != "admin":
        raise HTTPException(403, "Admin access required.")
    item = db.query(SubscriptionRequest).filter(SubscriptionRequest.id == request_id).first()
    if not item:
        raise HTTPException(404, "Subscription request not found.")
    if item.status != "pending":
        raise HTTPException(400, "This request has already been reviewed.")

    item.status = "approved" if data.action == "approve" else "rejected"
    item.reviewed_at = datetime.utcnow()
    item.reviewed_by = current_user.id

    target = db.query(User).filter(User.id == item.user_id).first()
    if data.action == "approve":
        if not target:
            raise HTTPException(404, "Requested user no longer exists.")
        target.role = "premium"

    if target:
        result_text = "approved" if data.action == "approve" else "rejected"
        create_notification(
            db,
            target.id,
            f"Your Premium access request has been {result_text}.",
            "premium_request_result",
        )

    db.commit()
    db.refresh(item)
    return serialize(item, db)
