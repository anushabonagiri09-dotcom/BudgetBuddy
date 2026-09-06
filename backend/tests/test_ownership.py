def auth(client, email):
    r=client.post("/auth/login",data={"username":email,"password":"secret123"})
    return {"Authorization":f"Bearer {r.json()['access_token']}"}

def test_expense_ownership(client):
    client.post("/auth/signup",json={"email":"a@example.com","password":"secret123","full_name":"A"})
    client.post("/auth/signup",json={"email":"b@example.com","password":"secret123","full_name":"B"})
    ra=client.post("/expense/",json={"category":"Food","amount":100,"date":"2026-08-11","payment_method":"Cash"},headers=auth(client,"a@example.com"))
    expense_id=ra.json()["id"]
    rb=client.get(f"/expense/{expense_id}",headers=auth(client,"b@example.com"))
    assert rb.status_code==404
