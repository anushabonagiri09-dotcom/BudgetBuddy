from datetime import date

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.budget import Budget
from app.models.expense import Expense
from app.schemas.budget import (
    BudgetCreate,
    BudgetUpdate,
)


def get_existing_budget(
    db: Session,
    user_id: int,
    category: str,
    month_year: str,
):
    return (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            Budget.category == category,
            Budget.month_year == month_year,
        )
        .first()
    )


def create_budget(
    db: Session,
    user_id: int,
    data: BudgetCreate,
):
    obj = Budget(
        user_id=user_id,
        **data.model_dump(),
    )

    db.add(obj)
    db.commit()
    db.refresh(obj)

    return obj


def get_budgets_by_user(
    db: Session,
    user_id: int,
    skip: int = 0,
    limit: int = 100,
):
    return (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id
        )
        .order_by(
            Budget.month_year.desc(),
            Budget.id.desc(),
        )
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_budget(
    db: Session,
    budget_id: int,
    user_id: int,
):
    return (
        db.query(Budget)
        .filter(
            Budget.id == budget_id,
            Budget.user_id == user_id,
        )
        .first()
    )


def update_budget(
    db: Session,
    obj: Budget,
    data: BudgetUpdate,
):
    values = data.model_dump()

    for key, value in values.items():
        setattr(obj, key, value)

    db.commit()
    db.refresh(obj)

    return obj


def delete_budget(
    db: Session,
    obj: Budget,
):
    db.delete(obj)
    db.commit()


def month_dates(month_year: str):
    year, month = map(
        int,
        month_year.split("-"),
    )

    start = date(
        year,
        month,
        1,
    )

    if month == 12:
        end = date(
            year + 1,
            1,
            1,
        )
    else:
        end = date(
            year,
            month + 1,
            1,
        )

    return start, end


def get_budget_progress(
    db: Session,
    user_id: int,
    month_year: str,
):
    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == user_id,
            Budget.month_year == month_year,
        )
        .order_by(
            Budget.category.asc()
        )
        .all()
    )

    result = []

    start, end = month_dates(
        month_year
    )

    for budget in budgets:

        spent_value = (
            db.query(
                func.sum(
                    Expense.amount
                )
            )
            .filter(
                Expense.user_id
                == user_id,

                Expense.category
                == budget.category,

                Expense.date >= start,

                Expense.date < end,
            )
            .scalar()
        )

        spent = float(
            spent_value or 0
        )

        limit = float(
            budget.limit_amount
        )

        percentage = (
            (spent / limit) * 100
            if limit > 0
            else 0
        )

        result.append(
            {
                "id": budget.id,
                "category": budget.category,
                "limit_amount": limit,
                "spent": spent,
                "remaining": limit - spent,
                "percentage": round(
                    percentage,
                    1,
                ),
                "month_year": month_year,
            }
        )

    return result