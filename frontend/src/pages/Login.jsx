import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();

    if (!form.email || !form.password) {
      return toast.error("Enter email and password");
    }

    try {
      setBusy(true);

      // Login and get user details
      const result = await login(form.email, form.password);

      toast.success("Login successful");

      // Redirect according to user role
      if (result.user?.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      toast.error(
        err.response?.data?.detail || "Login failed"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">

        <div className="auth-logo">💰</div>

        <h1>BudgetBuddy</h1>

        <p>Personal finance, made simple.</p>

        <form onSubmit={submit}>

          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={(e) =>
                setForm({
                  ...form,
                  password: e.target.value,
                })
              }
              placeholder="••••••••"
            />
          </label>

          <button
            className="primary full"
            disabled={busy}
          >
            {busy ? "Signing in..." : "Login"}
          </button>

        </form>

        <p className="auth-footer">
          New to BudgetBuddy?{" "}
          <Link to="/signup">Create account</Link>
        </p>

      </div>
    </div>
  );
}