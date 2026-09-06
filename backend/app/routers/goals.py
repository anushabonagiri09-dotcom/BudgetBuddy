from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_current_user
from app.crud.goal import create_goal, delete_goal, get_goal, get_goals, get_goal_by_title, update_goal
from app.crud.finance import get_available_balance
from app.crud.notification import create_notification
from app.database import get_db
from app.models.user import User
from app.schemas.goal import Contribution, SavingsGoalCreate, SavingsGoalOut, SavingsGoalUpdate

router = APIRouter(prefix="/goals", tags=["Savings Goals"])

@router.get("/available-balance")
def available_balance(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return {"available_balance": get_available_balance(db, current_user.id)}

@router.post("/", response_model=SavingsGoalOut, status_code=201)
def add_goal(data: SavingsGoalCreate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if get_goal_by_title(db, current_user.id, data.title):
        raise HTTPException(409, "A savings goal with this title already exists")
    available = get_available_balance(db, current_user.id)
    if data.current_amount > available:
        raise HTTPException(400, f"Initial savings amount cannot exceed available balance of ₹{available:.2f}")
    obj = create_goal(db, current_user.id, data)
    if obj.status == "completed":
        create_notification(db, current_user.id, f"Goal '{obj.title}' is completed!", "goal_milestone")
    return obj

@router.get("/", response_model=list[SavingsGoalOut])
def list_goals(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return get_goals(db, current_user.id)

@router.get("/{goal_id}", response_model=SavingsGoalOut)
def get_one(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_goal(db, goal_id, current_user.id)
    if not obj: raise HTTPException(404, "Savings goal not found")
    return obj

@router.put("/{goal_id}", response_model=SavingsGoalOut)
def update(goal_id: int, data: SavingsGoalUpdate, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_goal(db, goal_id, current_user.id)
    if not obj: raise HTTPException(404, "Savings goal not found")
    if data.title and data.title != obj.title and get_goal_by_title(db, current_user.id, data.title):
        raise HTTPException(409, "A savings goal with this title already exists")
    if data.target_amount and obj.current_amount > data.target_amount:
        raise HTTPException(400, "Target amount cannot be lower than the amount already saved")
    was_completed = obj.status == "completed"
    obj = update_goal(db, obj, data)
    if obj.status == "completed" and not was_completed:
        create_notification(db, current_user.id, f"Goal '{obj.title}' completed!", "goal_milestone")
    return obj

@router.patch("/{goal_id}/contribute", response_model=SavingsGoalOut)
def contribute(goal_id: int, data: Contribution, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_goal(db, goal_id, current_user.id)
    if not obj: raise HTTPException(404, "Savings goal not found")
    if obj.status == "completed": raise HTTPException(400, "Goal is already completed")
    remaining = round(obj.target_amount - obj.current_amount, 2)
    if data.amount > remaining:
        raise HTTPException(400, f"Contribution exceeds the remaining goal amount of ₹{remaining:.2f}")
    available = get_available_balance(db, current_user.id)
    if data.amount > available:
        raise HTTPException(400, f"Insufficient available balance. You can save up to ₹{available:.2f}")
    old_pct = (obj.current_amount / obj.target_amount) * 100
    obj.current_amount += data.amount
    obj.status = "completed" if obj.current_amount >= obj.target_amount else "in_progress"
    new_pct = (obj.current_amount / obj.target_amount) * 100
    db.commit(); db.refresh(obj)
    for threshold in (50, 75, 100):
        if old_pct < threshold <= new_pct:
            msg = f"Goal '{obj.title}' reached {threshold}%."
            if threshold == 100: msg = f"Goal '{obj.title}' completed!"
            create_notification(db, current_user.id, msg, "goal_milestone")
    return obj

@router.delete("/{goal_id}")
def remove(goal_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    obj = get_goal(db, goal_id, current_user.id)
    if not obj: raise HTTPException(404, "Savings goal not found")
    delete_goal(db, obj)
    return {"message": "Savings goal deleted successfully"}
