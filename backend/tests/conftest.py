import os
os.environ["DATABASE_URL"] = "sqlite:///./test_budgetbuddy.db"
os.environ["SECRET_KEY"] = "test-secret"

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app

engine = create_engine("sqlite:///./test_budgetbuddy.db", connect_args={"check_same_thread": False})
TestingSession = sessionmaker(bind=engine, autocommit=False, autoflush=False)

@pytest.fixture()
def client():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    def override():
        db=TestingSession()
        try: yield db
        finally: db.close()
    app.dependency_overrides[get_db]=override
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
    Base.metadata.drop_all(bind=engine)
