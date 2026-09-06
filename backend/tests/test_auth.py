def test_signup_login_me(client):
    r = client.post("/auth/signup", json={"email":"a@example.com","password":"secret123","full_name":"Anusha"})
    assert r.status_code == 201
    r = client.post("/auth/login", data={"username":"a@example.com","password":"secret123"})
    assert r.status_code == 200
    token = r.json()["access_token"]
    r = client.get("/auth/me", headers={"Authorization":f"Bearer {token}"})
    assert r.status_code == 200
    assert r.json()["email"] == "a@example.com"
