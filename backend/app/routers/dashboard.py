from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.crud.dashboard import get_dashboard_data
from app.database import get_db
from app.models.user import User
from app.schemas.dashboard import DashboardResponse

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/", response_model=DashboardResponse)
def dashboard(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_dashboard_data(db, current_user.id)
