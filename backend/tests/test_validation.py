def auth(client):
    client.post("/auth/signup", json={
        "email": "a@example.com", "password": "secret123", "full_name": "A"
    })
    r = client.post("/auth/login", data={
        "username": "a@example.com", "password": "secret123"
    })
    return {"Authorization": f"Bearer {r.json()['access_token']}"}


def test_negative_expense_rejected(client):
    h = auth(client)
    r = client.post("/expense/", json={
        "category": "Food", "amount": -1, "date": "2026-08-11",
        "payment_method": "Cash"
    }, headers=h)
    assert r.status_code == 422


def test_invalid_analytics_range_rejected(client):
    h = auth(client)
    r = client.get(
        "/analytics/summary?start_date=2026-08-20&end_date=2026-08-01",
        headers=h,
    )
    assert r.status_code == 400
