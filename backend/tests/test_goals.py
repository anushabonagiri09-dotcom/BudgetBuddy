def auth(client):
    client.post("/auth/signup",json={"email":"a@example.com","password":"secret123","full_name":"A"})
    r=client.post("/auth/login",data={"username":"a@example.com","password":"secret123"})
    return {"Authorization":f"Bearer {r.json()['access_token']}"}

def test_goal_completion_and_balance_deduction(client):
    h=auth(client)
    client.post("/income/",json={"source":"Salary","amount":1500,"date":"2026-08-11","payment_method":"Cash"},headers=h)
    r=client.post("/goals/",json={"title":"Laptop","target_amount":1000,"current_amount":0},headers=h)
    assert r.status_code==201
    goal_id=r.json()["id"]
    r=client.patch(f"/goals/{goal_id}/contribute",json={"amount":1000},headers=h)
    assert r.status_code==200
    assert r.json()["status"]=="completed"
    balance=client.get("/goals/available-balance",headers=h).json()["available_balance"]
    assert balance == 500.0

def test_duplicate_goal_blocked(client):
    h=auth(client)
    client.post("/income/",json={"source":"Salary","amount":5000,"date":"2026-08-11","payment_method":"Cash"},headers=h)
    first=client.post("/goals/",json={"title":"Laptop","target_amount":1000},headers=h)
    second=client.post("/goals/",json={"title":"Laptop","target_amount":1500},headers=h)
    assert first.status_code==201
    assert second.status_code==409

def test_contribution_cannot_exceed_available_balance(client):
    h=auth(client)
    client.post("/income/",json={"source":"Salary","amount":500,"date":"2026-08-11","payment_method":"Cash"},headers=h)
    r=client.post("/goals/",json={"title":"Phone","target_amount":1000},headers=h)
    goal_id=r.json()["id"]
    r=client.patch(f"/goals/{goal_id}/contribute",json={"amount":501},headers=h)
    assert r.status_code==400
