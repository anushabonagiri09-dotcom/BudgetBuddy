from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import Base, engine
from app.config import FRONTEND_URL
from app import models  # noqa: F401

from app.routers import (
    auth,
    expense,
    income,
    budget,
    bank_account,
    dashboard,
    goals,
    notifications,
    analytics,
    reports,
    subscriptions,
    admin_financials,
)


Base.metadata.create_all(bind=engine)

# Lightweight forward-compatible schema update for existing SQLite databases.
with engine.begin() as connection:
    columns = {
        column["name"]
        for column in inspect(connection).get_columns("profiles")
    }

    if "phone" not in columns:
        connection.execute(
            text("ALTER TABLE profiles ADD COLUMN phone VARCHAR(30)")
        )


app = FastAPI(
    title="BudgetBuddy API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        FRONTEND_URL,
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(auth.router)
app.include_router(expense.router)
app.include_router(income.router)
app.include_router(budget.router)
app.include_router(bank_account.router)
app.include_router(dashboard.router)
app.include_router(goals.router)
app.include_router(notifications.router)
app.include_router(analytics.router)
app.include_router(reports.router)
app.include_router(subscriptions.router)
app.include_router(admin_financials.router)


@app.get("/")
def root():
    return {"message": "BudgetBuddy API is running successfully!"}


@app.get("/db-test")
def db_test():
    with engine.connect() as connection:
        connection.execute(text("SELECT 1"))
    return {"status": "Database connected successfully!"}
