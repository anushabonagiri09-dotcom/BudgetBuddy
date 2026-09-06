from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base


class Profile(Base):
    __tablename__ = "profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=True)
    monthly_income = Column(Float, default=0.0, nullable=False)
    currency = Column(String(10), default="INR", nullable=False)

    owner = relationship("User", back_populates="profile")
