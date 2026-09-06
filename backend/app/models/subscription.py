from datetime import datetime
from sqlalchemy import Column, DateTime, ForeignKey, Integer, String
from app.database import Base

class SubscriptionRequest(Base):
    __tablename__ = "subscription_requests"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    requested_role = Column(String(30), default="premium", nullable=False)
    status = Column(String(20), default="pending", nullable=False, index=True)
    requested_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    reviewed_at = Column(DateTime, nullable=True)
    reviewed_by = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
