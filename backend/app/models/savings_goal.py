from datetime import date, datetime
from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from app.database import Base

class SavingsGoal(Base):
    __tablename__ = "savings_goals"
    __table_args__ = (UniqueConstraint("user_id", "title", name="uq_savings_goal_user_title"),)

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(120), nullable=False)
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0, nullable=False)
    target_date = Column(Date, nullable=True)
    status = Column(String(30), default="in_progress", nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="savings_goals")
