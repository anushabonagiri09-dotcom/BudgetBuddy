def auth(client):
    client.post("/auth/signup",json={"email":"a@example.com","password":"secret123","full_name":"A"})
    r=client.post("/auth/login",data={"username":"a@example.com","password":"secret123"})
    return {"Authorization":f"Bearer {r.json()['access_token']}"}

def test_analytics_summary_and_trend(client):
    h=auth(client)
    client.post("/income/",json={"source":"Salary","amount":5000,"date":"2026-08-11","payment_method":"Cash"},headers=h)
    client.post("/expense/",json={"category":"Food","amount":1000,"date":"2026-08-11","payment_method":"Cash"},headers=h)
    summary=client.get("/analytics/summary",headers=h)
    assert summary.status_code==200
    assert summary.json()["total_income"]==5000
    assert summary.json()["total_expense"]==1000
    assert summary.json()["available_balance"]==4000
    trend=client.get("/analytics/monthly-trend?months=6",headers=h)
    assert trend.status_code==200
    assert len(trend.json())==6


def test_basic_user_analytics_is_current_month_only(client):
    h = auth(client)
    client.post("/income/", json={
        "source": "Old income", "amount": 9000, "date": "2026-08-11",
        "payment_method": "Cash"
    }, headers=h)
    client.post("/income/", json={
        "source": "Current income", "amount": 1000, "date": "2026-09-01",
        "payment_method": "Cash"
    }, headers=h)
    summary = client.get("/analytics/summary", headers=h)
    assert summary.json()["total_income"] == 1000
    trend = client.get("/analytics/monthly-trend?months=12", headers=h)
    assert len(trend.json()) == 1


def test_system_analytics_requires_admin(client):
    h = auth(client)
    assert client.get("/analytics/system", headers=h).status_code == 403
