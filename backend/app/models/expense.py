from datetime import date, datetime
from sqlalchemy import Column, Date, DateTime, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category = Column(String(100), nullable=False)
    amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="Cash", nullable=False)
    description = Column(String(255), nullable=True)
    date = Column(Date, default=date.today, nullable=False)
    bank_account_id = Column(Integer, ForeignKey("bank_accounts.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    user = relationship("User", back_populates="expenses")
    bank_account = relationship("BankAccount", back_populates="expenses")
