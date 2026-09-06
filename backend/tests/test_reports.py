from datetime import date


def auth(client, email="a@example.com"):
    client.post("/auth/signup", json={
        "email": email, "password": "secret123", "full_name": "A"
    })
    r = client.post("/auth/login", data={
        "username": email, "password": "secret123"
    })
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_monthly_report_and_exports_require_premium(client):
    h = auth(client)
    client.post("/income/", json={
        "source": "Salary", "amount": 5000, "date": "2026-08-11",
        "payment_method": "Cash"
    }, headers=h)
    client.post("/expense/", json={
        "category": "Food", "amount": 1000, "date": "2026-08-12",
        "payment_method": "Cash"
    }, headers=h)

    # Basic users cannot export.
    assert client.get("/reports/export/pdf?month=8&year=2026", headers=h).status_code == 403
    assert client.get("/reports/export/excel?month=8&year=2026", headers=h).status_code == 403


def test_report_isolation(client):
    ha = auth(client, "a@example.com")
    hb = auth(client, "b@example.com")
    client.post("/income/", json={
        "source": "Salary", "amount": 5000, "date": "2026-08-11",
        "payment_method": "Cash"
    }, headers=ha)
    report = client.get("/reports/monthly?month=8&year=2026", headers=hb)
    assert report.status_code == 200
    assert report.json()["total_income"] == 0
