def auth(client):
    client.post("/auth/signup",json={"email":"a@example.com","password":"secret123","full_name":"A"})
    r=client.post("/auth/login",data={"username":"a@example.com","password":"secret123"})
    return {"Authorization":f"Bearer {r.json()['access_token']}"}

def test_duplicate_budget_and_alerts(client):
    h=auth(client)
    r=client.post("/budget/",json={"category":"Food","limit_amount":100,"month_year":"2026-08"},headers=h)
    assert r.status_code==201
    duplicate=client.post("/budget/",json={"category":"Food","limit_amount":200,"month_year":"2026-08"},headers=h)
    assert duplicate.status_code==409
    client.post("/expense/",json={"category":"Food","amount":85,"date":"2026-08-11","payment_method":"Cash"},headers=h)
    notes=client.get("/notifications/",headers=h).json()
    assert any("80%" in n["message"] for n in notes)
    client.post("/expense/",json={"category":"Food","amount":20,"date":"2026-08-11","payment_method":"Cash"},headers=h)
    notes=client.get("/notifications/",headers=h).json()
    assert any("exceeded" in n["message"] for n in notes)
