from sqlalchemy.orm import Session
from app.core.security import hash_password
from app.models.profile import Profile
from app.models.user import User

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def create_user(db: Session, email: str, password: str, full_name: str):
    user = User(email=email.lower(), hashed_password=hash_password(password))
    db.add(user)
    db.flush()
    db.add(Profile(user_id=user.id, full_name=full_name))
    db.commit()
    db.refresh(user)
    return user
