from datetime import date

from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
)

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user

from app.crud.budget import (
    create_budget,
    delete_budget,
    get_budget,
    get_budgets_by_user,
    get_budget_progress,
    update_budget,
    get_existing_budget,
)

from app.crud.notification import (
    create_unique_notification,
)

from app.database import get_db

from app.models.budget import Budget
from app.models.expense import Expense
from app.models.user import User

from app.schemas.budget import (
    BudgetCreate,
    BudgetOut,
    BudgetProgress,
    BudgetUpdate,
    AnnualBudgetCreate,
)


router = APIRouter(
    prefix="/budget",
    tags=["Budgets"],
)


# ============================================================
# HELPERS
# ============================================================


def month_dates(
    month_year: str,
):
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


def month_spent(
    db: Session,
    user_id: int,
    category: str,
    month_year: str,
):
    start, end = month_dates(
        month_year
    )

    value = (
        db.query(
            func.sum(
                Expense.amount
            )
        )
        .filter(
            Expense.user_id == user_id,
            Expense.category == category,
            Expense.date >= start,
            Expense.date < end,
        )
        .scalar()
    )

    return float(value or 0)


def notify_budget_status(
    db: Session,
    user_id: int,
    category: str,
    month_year: str,
    limit: float,
):
    if limit <= 0:
        return

    spent = month_spent(
        db,
        user_id,
        category,
        month_year,
    )

    if spent <= 0:
        return

    percentage = (
        spent / limit
    ) * 100

    year, month = map(
        int,
        month_year.split("-"),
    )

    label = date(
        year,
        month,
        1,
    ).strftime(
        "%B %Y"
    )

    if percentage >= 100:

        create_unique_notification(
            db,
            user_id,
            (
                f"You have exceeded your "
                f"{category} budget for "
                f"{label}."
            ),
            "budget_alert",
        )

    elif percentage >= 80:

        create_unique_notification(
            db,
            user_id,
            (
                f"You have used "
                f"{percentage:.0f}% of your "
                f"{category} budget for "
                f"{label}."
            ),
            "budget_alert",
        )


# ============================================================
# CREATE MONTHLY BUDGET
#
# Existing endpoint:
# POST /budget/
#
# ============================================================


@router.post(
    "/",
    response_model=BudgetOut,
    status_code=201,
)
def add_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    existing = get_existing_budget(
        db,
        current_user.id,
        data.category,
        data.month_year,
    )

    if existing:

        raise HTTPException(
            status_code=409,
            detail=(
                "A budget already exists "
                "for this category and month. "
                "Use Update Monthly Budget."
            ),
        )

    obj = create_budget(
        db,
        current_user.id,
        data,
    )

    create_unique_notification(
        db,
        current_user.id,
        (
            f"Your {data.category} budget "
            f"for {data.month_year} was "
            f"created with a limit of "
            f"₹{data.limit_amount:.2f}."
        ),
        "budget_created",
    )

    notify_budget_status(
        db,
        current_user.id,
        data.category,
        data.month_year,
        data.limit_amount,
    )

    return obj


# ============================================================
# CREATE MONTHLY BUDGET
#
# NEW ENDPOINT
#
# POST /budget/monthly
#
# This fixes:
# 405 Method Not Allowed
#
# ============================================================


@router.post(
    "/monthly",
    response_model=BudgetOut,
    status_code=201,
)
def create_monthly_budget(
    data: BudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    existing = get_existing_budget(
        db,
        current_user.id,
        data.category,
        data.month_year,
    )

    if existing:

        raise HTTPException(
            status_code=409,
            detail=(
                "A budget already exists "
                "for this category and month."
            ),
        )

    obj = create_budget(
        db,
        current_user.id,
        data,
    )

    create_unique_notification(
        db,
        current_user.id,
        (
            f"Your {data.category} budget "
            f"for {data.month_year} was "
            f"created with a limit of "
            f"₹{data.limit_amount:.2f}."
        ),
        "budget_created",
    )

    notify_budget_status(
        db,
        current_user.id,
        data.category,
        data.month_year,
        data.limit_amount,
    )

    return obj


# ============================================================
# ANNUAL BUDGET
# ============================================================


@router.post(
    "/annual",
    response_model=list[BudgetOut],
    status_code=201,
)
def add_annual_budget(
    data: AnnualBudgetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    allocations = {}

    for month in range(1, 13):

        key = str(month).zfill(2)

        value = float(
            data.allocations.get(
                key,
                0,
            )
        )

        if value < 0:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Monthly allocations "
                    "cannot be negative."
                ),
            )

        allocations[key] = value

    total = round(
        sum(
            allocations.values()
        ),
        2,
    )

    if total > (
        data.annual_budget + 0.01
    ):

        raise HTTPException(
            status_code=400,
            detail=(
                f"Monthly allocations total "
                f"₹{total:.2f}, which exceeds "
                f"the annual budget of "
                f"₹{data.annual_budget:.2f}."
            ),
        )

    saved = []

    for month, amount in allocations.items():

        month_year = (
            f"{data.year}-{month}"
        )

        existing = get_existing_budget(
            db,
            current_user.id,
            data.category,
            month_year,
        )

        if amount > 0:

            if existing:

                existing.limit_amount = (
                    amount
                )

                db.add(existing)

                saved.append(
                    existing
                )

            else:

                obj = Budget(
                    user_id=current_user.id,
                    category=data.category,
                    limit_amount=amount,
                    month_year=month_year,
                )

                db.add(obj)

                saved.append(
                    obj
                )

        else:

            if existing:
                db.delete(existing)

    db.commit()

    for budget in saved:

        db.refresh(budget)

        notify_budget_status(
            db,
            current_user.id,
            budget.category,
            budget.month_year,
            float(
                budget.limit_amount
            ),
        )

    create_unique_notification(
        db,
        current_user.id,
        (
            f"Your {data.category} annual "
            f"budget for {data.year} was "
            f"saved across "
            f"{len(saved)} month(s)."
        ),
        "budget_created",
    )

    return saved


# ============================================================
# GET MONTHLY BUDGETS
#
# NEW ENDPOINT
#
# GET /budget/monthly?month=8&year=2026
#
# IMPORTANT:
# This MUST be BEFORE /{budget_id}
#
# ============================================================


@router.get(
    "/monthly",
    response_model=list[BudgetOut],
)
def get_monthly_budgets(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    # Validate month

    if month < 1 or month > 12:

        raise HTTPException(
            status_code=400,
            detail=(
                "Month must be between "
                "1 and 12."
            ),
        )

    # Validate year

    if year < 2000 or year > 2100:

        raise HTTPException(
            status_code=400,
            detail="Invalid year.",
        )

    # Convert:
    #
    # month = 8
    # year = 2026
    #
    # into:
    #
    # 2026-08

    month_year = (
        f"{year}-{month:02d}"
    )

    budgets = (
        db.query(Budget)
        .filter(
            Budget.user_id == current_user.id,
            Budget.month_year == month_year,
        )
        .order_by(
            Budget.id.asc()
        )
        .all()
    )

    return budgets


# ============================================================
# LIST ALL BUDGETS
#
# GET /budget/
#
# ============================================================


@router.get(
    "/",
    response_model=list[BudgetOut],
)
def list_budgets(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    return get_budgets_by_user(
        db,
        current_user.id,
        skip,
        min(limit, 200),
    )


# ============================================================
# PROGRESS
#
# GET /budget/progress
#
# ============================================================


@router.get(
    "/progress",
    response_model=list[BudgetProgress],
)
def progress(
    month_year: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):
    selected_month = month_year or date.today().strftime("%Y-%m")

    # Keep the endpoint predictable for the frontend and reject malformed
    # periods before they reach the date calculations in the CRUD layer.
    try:
        parsed_year, parsed_month = map(int, selected_month.split("-"))
        if len(selected_month) != 7 or parsed_month < 1 or parsed_month > 12:
            raise ValueError
        if parsed_year < 2000 or parsed_year > 2100:
            raise ValueError
    except (ValueError, AttributeError):
        raise HTTPException(400, "month_year must use YYYY-MM format.")

    return get_budget_progress(
        db,
        current_user.id,
        selected_month,
    )


# ============================================================
# GET ONE
#
# GET /budget/{budget_id}
#
# IMPORTANT:
# This MUST remain AFTER /monthly and /progress
#
# ============================================================


@router.get(
    "/{budget_id}",
    response_model=BudgetOut,
)
def get_one(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    obj = get_budget(
        db,
        budget_id,
        current_user.id,
    )

    if not obj:

        raise HTTPException(
            status_code=404,
            detail="Budget not found",
        )

    return obj


# ============================================================
# UPDATE MONTHLY BUDGET
#
# PUT /budget/{budget_id}
#
# ============================================================


@router.put(
    "/{budget_id}",
    response_model=BudgetOut,
)
def update(
    budget_id: int,
    data: BudgetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    obj = get_budget(
        db,
        budget_id,
        current_user.id,
    )

    if not obj:

        raise HTTPException(
            status_code=404,
            detail="Budget not found",
        )

    duplicate = get_existing_budget(
        db,
        current_user.id,
        data.category,
        data.month_year,
    )

    if (
        duplicate
        and duplicate.id != obj.id
    ):

        raise HTTPException(
            status_code=409,
            detail=(
                "Another budget already "
                "exists for this category "
                "and month."
            ),
        )

    result = update_budget(
        db,
        obj,
        data,
    )

    create_unique_notification(
        db,
        current_user.id,
        (
            f"Your {data.category} budget "
            f"for {data.month_year} was "
            f"updated to "
            f"₹{data.limit_amount:.2f}."
        ),
        "budget_updated",
    )

    notify_budget_status(
        db,
        current_user.id,
        data.category,
        data.month_year,
        data.limit_amount,
    )

    return result


# ============================================================
# DELETE
#
# DELETE /budget/{budget_id}
#
# ============================================================


@router.delete(
    "/{budget_id}"
)
def remove(
    budget_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        get_current_user
    ),
):

    obj = get_budget(
        db,
        budget_id,
        current_user.id,
    )

    if not obj:

        raise HTTPException(
            status_code=404,
            detail="Budget not found",
        )

    category = obj.category
    month_year = obj.month_year

    delete_budget(
        db,
        obj,
    )

    create_unique_notification(
        db,
        current_user.id,
        (
            f"Your {category} budget "
            f"for {month_year} was deleted."
        ),
        "budget_deleted",
    )

    return {
        "message": (
            f"{category} budget for "
            f"{month_year} deleted successfully."
        )
    }
    