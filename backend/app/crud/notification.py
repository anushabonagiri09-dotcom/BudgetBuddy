from sqlalchemy.orm import Session

from app.models.notification import Notification


def create_notification(
    db: Session,
    user_id: int,
    message: str,
    kind: str,
):
    notification = Notification(
        user_id=user_id,
        message=message,
        type=kind,
        is_read=False,
    )

    db.add(notification)
    db.commit()
    db.refresh(notification)

    return notification


def create_unique_notification(
    db: Session,
    user_id: int,
    message: str,
    kind: str,
):
    existing = (
        db.query(Notification)
        .filter(
            Notification.user_id
            == user_id,

            Notification.message
            == message,

            Notification.type
            == kind,
        )
        .first()
    )

    if existing:
        return existing

    return create_notification(
        db,
        user_id,
        message,
        kind,
    )


def get_notifications(
    db: Session,
    user_id: int,
):
    return (
        db.query(Notification)
        .filter(
            Notification.user_id
            == user_id
        )
        .order_by(
            Notification.created_at.desc()
        )
        .all()
    )


def get_notification(
    db: Session,
    notification_id: int,
    user_id: int,
):
    return (
        db.query(Notification)
        .filter(
            Notification.id
            == notification_id,

            Notification.user_id
            == user_id,
        )
        .first()
    )