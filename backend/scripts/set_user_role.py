"""Promote an existing BudgetBuddy account to a chosen role.

Usage:
    python scripts/set_user_role.py user@example.com admin
    python scripts/set_user_role.py user@example.com premium

Run from the backend directory with the project virtual environment active.
"""
import sys
from app.database import SessionLocal
from app.models.user import User

ALLOWED = {"student", "premium", "admin"}

if len(sys.argv) != 3 or sys.argv[2] not in ALLOWED:
    raise SystemExit("Usage: python scripts/set_user_role.py EMAIL student|premium|admin")

email, role = sys.argv[1], sys.argv[2]
db = SessionLocal()
try:
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise SystemExit(f"User not found: {email}")
    user.role = role
    db.commit()
    print(f"Updated {email} -> {role}")
finally:
    db.close()
