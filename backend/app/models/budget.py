from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
)

from sqlalchemy.orm import relationship

from app.database import Base


class Budget(Base):

    __tablename__ = "budgets"

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "category",
            "month_year",
            name="uq_budget_user_category_month",
        ),
    )

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey(
            "users.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    category = Column(
        String(100),
        nullable=False,
    )

    limit_amount = Column(
        Float,
        nullable=False,
    )

    month_year = Column(
        String(7),
        nullable=False,
    )

    created_at = Column(
        DateTime,
        default=datetime.utcnow,
        nullable=False,
    )

    user = relationship(
        "User",
        back_populates="budgets",
    )