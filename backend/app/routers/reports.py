from datetime import date
from io import BytesIO

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from openpyxl import Workbook
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.deps import get_current_user
from app.crud.notification import create_notification
from app.crud.report import monthly_report
from app.database import get_db
from app.models.expense import Expense
from app.models.income import Income
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports"])


def report_period(current_user, month, year):
    if current_user.role not in ("premium", "admin"):
        today = date.today()
        return today.month, today.year
    return month, year


def require_export_role(current_user):
    if current_user.role not in ("premium", "admin"):
        raise HTTPException(403, "PDF/Excel export is available to Premium and Admin users.")


def admin_monthly_report(db: Session, month: int, year: int):
    """Aggregate-only admin report. No user-level history is returned."""
    start = date(year, month, 1)
    end = date(year + (1 if month == 12 else 0), 1 if month == 12 else month + 1, 1)

    total_income = float(
        db.query(func.sum(Income.amount))
        .filter(Income.date >= start, Income.date < end)
        .scalar() or 0
    )
    total_expense = float(
        db.query(func.sum(Expense.amount))
        .filter(Expense.date >= start, Expense.date < end)
        .scalar() or 0
    )

    grouped = (
        db.query(Expense.category, func.sum(Expense.amount).label("total"))
        .filter(Expense.date >= start, Expense.date < end)
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .all()
    )

    return {
        "month": f"{year}-{month:02d}",
        "total_income": total_income,
        "total_expense": total_expense,
        "balance": total_income - total_expense,
        "categories": [
            {"category": x.category or "Other", "total": float(x.total or 0)}
            for x in grouped
        ],
    }


@router.get("/monthly")
def report(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    month, year = report_period(current_user, month, year)
    if current_user.role == "admin":
        return admin_monthly_report(db, month, year)
    return monthly_report(db, current_user.id, month, year)


@router.get("/export/pdf")
def export_pdf(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_export_role(current_user)
    month, year = report_period(current_user, month, year)
    data = admin_monthly_report(db, month, year) if current_user.role == "admin" else monthly_report(db, current_user.id, month, year)

    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=A4)
    y = 800
    pdf.setFont("Helvetica-Bold", 18)
    title = "BudgetBuddy Admin Aggregate Report" if current_user.role == "admin" else "BudgetBuddy Monthly Report"
    pdf.drawString(50, y, title)
    y -= 30
    pdf.setFont("Helvetica", 10)
    if current_user.role == "admin":
        pdf.drawString(50, y, "Privacy scope: aggregate totals across all users only")
        y -= 18
    for label, value in [
        ("Month", data["month"]),
        ("Total Income", f"INR {data['total_income']:.2f}"),
        ("Total Expense", f"INR {data['total_expense']:.2f}"),
        ("Balance", f"INR {data['balance']:.2f}"),
    ]:
        pdf.drawString(50, y, f"{label}: {value}")
        y -= 21
    y -= 8
    pdf.setFont("Helvetica-Bold", 12)
    pdf.drawString(50, y, "Spending by Category")
    y -= 20
    pdf.setFont("Helvetica", 10)
    categories = data["categories"] or [{"category": "None", "total": 0}]
    for item in categories:
        pdf.drawString(65, y, f"{item['category']}: INR {item['total']:.2f}")
        y -= 17
        if y < 45:
            pdf.showPage()
            y = 800
            pdf.setFont("Helvetica", 10)
    pdf.save()
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=budgetbuddy-{data['month']}.pdf"},
    )


@router.get("/export/excel")
def export_excel(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    require_export_role(current_user)
    month, year = report_period(current_user, month, year)
    data = admin_monthly_report(db, month, year) if current_user.role == "admin" else monthly_report(db, current_user.id, month, year)

    wb = Workbook()
    ws = wb.active
    ws.title = "Monthly Report"
    ws.append(["BudgetBuddy Monthly Report"])
    if current_user.role == "admin":
        ws.append(["Privacy Scope", "Aggregate totals across all users; no user-level history"])
    ws.append(["Month", data["month"]])
    ws.append(["Total Income", data["total_income"]])
    ws.append(["Total Expense", data["total_expense"]])
    ws.append(["Balance", data["balance"]])
    ws.append([])
    ws.append(["Category", "Total"])
    for item in data["categories"]:
        ws.append([item["category"], item["total"]])

    buffer = BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return StreamingResponse(
        buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=budgetbuddy-{data['month']}.xlsx"},
    )


@router.post("/generate-monthly-notification")
def generate_monthly_notification(
    month: int = Query(..., ge=1, le=12),
    year: int = Query(..., ge=2020, le=2100),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    data = monthly_report(db, current_user.id, month, year)
    note = create_notification(
        db,
        current_user.id,
        f"{data['month']} report: income INR {data['total_income']:.0f}, expenses INR {data['total_expense']:.0f}, balance INR {data['balance']:.0f}.",
        "monthly_report",
    )
    return note
