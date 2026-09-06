from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import (
    get_current_user,
)

from app.crud.expense import (
    create_expense,
    delete_expense,
    get_expense,
    get_expenses_by_user,
    get_expense_summary,
    update_expense,
)

from app.crud.notification import (
    create_unique_notification,
)

from app.database import get_db

from app.models.budget import Budget
from app.models.expense import Expense
from app.models.bank_account import BankAccount
from app.models.user import User

from app.schemas.expense import (
    ExpenseCreate,
    ExpenseOut,
    ExpenseSummary,
    ExpenseUpdate,
)


router = APIRouter(
    prefix="/expense",
    tags=["Expenses"],
)


def month_end(
    value: date,
):
    if value.month == 12:
        return date(
            value.year + 1,
            1,
            1,
        )

    return date(
        value.year,
        value.month + 1,
        1,
    )


def check_account(
    db: Session,
    user_id: int,
    account_id: int | None,
):

    if account_id is None:
        return None

    account = (
        db.query(BankAccount)
        .filter(
            BankAccount.id
            == account_id,
            BankAccount.user_id
            == user_id,
        )
        .first()
    )

    if not account:

        raise HTTPException(
            status_code=400,
            detail=(
                "Selected bank account "
                "does not belong to you."
            ),
        )

    return account


# ==========================================
# ADD EXPENSE
# ==========================================


@router.post(
    "/",
    response_model=ExpenseOut,
    status_code=201,
)
def add_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    account = check_account(
        db,
        current_user.id,
        data.bank_account_id,
    )

    if (
        data.payment_method.lower()
        in ("bank account", "bank")
        and not account
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Select a bank account "
                "for bank payments."
            ),
        )

    month_year = data.date.strftime(
        "%Y-%m"
    )

    # --------------------------------------
    # Find matching budget
    # --------------------------------------

    budget = (
        db.query(Budget)
        .filter(
            Budget.user_id
            == current_user.id,

            Budget.category
            == data.category,

            Budget.month_year
            == month_year,
        )
        .first()
    )

    previous_spent = 0.0

    if budget:

        start = date(
            data.date.year,
            data.date.month,
            1,
        )

        end = month_end(
            data.date
        )

        previous_spent_value = (
            db.query(
                func.sum(
                    Expense.amount
                )
            )
            .filter(
                Expense.user_id
                == current_user.id,

                Expense.category
                == data.category,

                Expense.date >= start,

                Expense.date < end,
            )
            .scalar()
        )

        previous_spent = float(
            previous_spent_value or 0
        )

    # --------------------------------------
    # Create expense
    # --------------------------------------

    obj = create_expense(
        db,
        current_user.id,
        data,
    )

    # --------------------------------------
    # Update bank account
    # --------------------------------------

    if account:

        account.balance -= data.amount

        db.commit()

    # --------------------------------------
    # Budget notification
    # --------------------------------------

    if budget:

        new_total = (
            previous_spent
            + data.amount
        )

        limit = float(
            budget.limit_amount
        )

        if limit > 0:

            old_percentage = (
                previous_spent
                / limit
            ) * 100

            new_percentage = (
                new_total
                / limit
            ) * 100

            label = data.date.strftime(
                "%B %Y"
            )

            # 80% warning
            if (
                old_percentage < 80
                and new_percentage >= 80
                and new_total < limit
            ):

                create_unique_notification(
                    db,
                    current_user.id,
                    (
                        f"You have used "
                        f"{new_percentage:.0f}% "
                        f"of your "
                        f"{data.category} "
                        f"budget for "
                        f"{label}."
                    ),
                    "budget_alert",
                )

            # 100% exceeded
            if (
                previous_spent
                <= limit
                and new_total
                > limit
            ):

                create_unique_notification(
                    db,
                    current_user.id,
                    (
                        f"You have exceeded "
                        f"your "
                        f"{data.category} "
                        f"budget for "
                        f"{label}."
                    ),
                    "budget_alert",
                )

    return obj


# ==========================================
# LIST EXPENSES
# ==========================================


@router.get(
    "/",
    response_model=list[ExpenseOut],
)
def list_expenses(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    return get_expenses_by_user(
        db,
        current_user.id,
        skip,
        min(limit, 200),
    )


# ==========================================
# EXPENSE SUMMARY
# ==========================================


@router.get(
    "/summary",
    response_model=list[ExpenseSummary],
)
def summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    rows = get_expense_summary(
        db,
        current_user.id,
    )

    return [
        {
            "category": row.category,
            "total": float(row.total),
        }
        for row in rows
    ]


# ==========================================
# GET EXPENSE
# ==========================================


@router.get(
    "/{expense_id}",
    response_model=ExpenseOut,
)
def get_one(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    obj = get_expense(
        db,
        expense_id,
        current_user.id,
    )

    if not obj:

        raise HTTPException(
            status_code=404,
            detail="Expense not found",
        )

    return obj


# ==========================================
# UPDATE EXPENSE
# ==========================================


@router.put(
    "/{expense_id}",
    response_model=ExpenseOut,
)
def update(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    obj = get_expense(
        db,
        expense_id,
        current_user.id,
    )

    if not obj:

        raise HTTPException(
            status_code=404,
            detail="Expense not found",
        )

    old_account = check_account(
        db,
        current_user.id,
        obj.bank_account_id,
    )

    new_account = check_account(
        db,
        current_user.id,
        data.bank_account_id,
    )

    if (
        data.payment_method.lower()
        in ("bank account", "bank")
        and not new_account
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                "Select a bank account "
                "for bank payments."
            ),
        )

    if old_account:
        old_account.balance += (
            obj.amount
        )

    if new_account:
        new_account.balance -= (
            data.amount
        )

    obj = update_expense(
        db,
        obj,
        data,
    )

    return obj


# ==========================================
# DELETE EXPENSE
# ==========================================


@router.delete(
    "/{expense_id}"
)
def remove(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    obj = get_expense(
        db,
        expense_id,
        current_user.id,
    )

    if not obj:

        raise HTTPException(
            status_code=404,
            detail="Expense not found",
        )

    account = check_account(
        db,
        current_user.id,
        obj.bank_account_id,
    )

    if account:
        account.balance += obj.amount

    delete_expense(
        db,
        obj,
    )

    return {
        "message":
            "Expense deleted successfully"
    }