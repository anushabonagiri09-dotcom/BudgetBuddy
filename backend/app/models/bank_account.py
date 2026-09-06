from sqlalchemy import Column, Float, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from app.database import Base

class BankAccount(Base):
    __tablename__ = "bank_accounts"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    bank_name = Column(String(100), nullable=False)
    account_number = Column(String(30), nullable=False)
    account_type = Column(String(30), default="Savings", nullable=False)
    balance = Column(Float, default=0.0, nullable=False)

    owner = relationship("User", back_populates="bank_accounts")
    incomes = relationship("Income", back_populates="bank_account")
    expenses = relationship("Expense", back_populates="bank_account")
