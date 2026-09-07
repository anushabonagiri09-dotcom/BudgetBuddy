from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database import Base, engine, SessionLocal
from app.models import User
from app.core.security import hash_password
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
    "https://budget-buddy-lyart-phi.vercel.app",
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
@app.get("/setup-admin")
def setup_admin():
    db = SessionLocal()

    try:
        email = "admin@gmail.com"
        password = "admin123"

        user = db.query(User).filter(User.email == email).first()

        if user:
            user.hashed_password = hash_password(password)
            user.role = "admin"
            user.is_active = True
            message = "Existing user converted to admin."
        else:
            user = User(
                email=email,
                hashed_password=hash_password(password),
                role="admin",
                is_active=True,
            )
            db.add(user)
            message = "New admin account created."

        db.commit()

        return {
            "message": message,
            "email": email,
            "role": "admin",
        }

    except Exception as error:
        db.rollback()
        return {
            "message": "Admin setup failed.",
            "error": str(error),
        }

    finally:
        db.close()