from sqlalchemy.orm import Session
from app.models.savings_goal import SavingsGoal
from app.schemas.goal import SavingsGoalCreate, SavingsGoalUpdate


def create_goal(db: Session, user_id: int, data: SavingsGoalCreate):
    obj = SavingsGoal(user_id=user_id, **data.model_dump())
    if obj.current_amount >= obj.target_amount:
        obj.current_amount = obj.target_amount
        obj.status = "completed"
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def get_goals(db: Session, user_id: int):
    return db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id).order_by(SavingsGoal.id.desc()).all()


def get_goal(db: Session, goal_id: int, user_id: int):
    return db.query(SavingsGoal).filter(SavingsGoal.id == goal_id, SavingsGoal.user_id == user_id).first()


def get_goal_by_title(db: Session, user_id: int, title: str):
    return db.query(SavingsGoal).filter(SavingsGoal.user_id == user_id, SavingsGoal.title == title).first()


def update_goal(db: Session, obj: SavingsGoal, data: SavingsGoalUpdate):
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    if obj.current_amount >= obj.target_amount:
        obj.current_amount = obj.target_amount
        obj.status = "completed"
    else:
        obj.status = "in_progress"
    db.commit()
    db.refresh(obj)
    return obj


def delete_goal(db: Session, obj: SavingsGoal):
    db.delete(obj)
    db.commit()
