from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy.orm import Session

from app.core.deps import (
    get_current_user,
)

from app.crud.notification import (
    get_notification,
    get_notifications,
)

from app.database import get_db

from app.models.user import User

from app.schemas.notification import (
    NotificationOut,
)


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"],
)


@router.get(
    "/",
    response_model=list[NotificationOut],
)
def list_notifications(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    return get_notifications(
        db,
        current_user.id,
    )


@router.patch(
    "/{notification_id}/read",
    response_model=NotificationOut,
)
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    notification = get_notification(
        db,
        notification_id,
        current_user.id,
    )

    if not notification:

        raise HTTPException(
            status_code=404,
            detail="Notification not found",
        )

    notification.is_read = True

    db.commit()
    db.refresh(notification)

    return notification