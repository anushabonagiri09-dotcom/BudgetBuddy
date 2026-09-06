import React from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { useAuth } from "../context/AuthContext";

export default function Register() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ full_name:"", email:"", password:"", confirm:"" });
  const submit = async (e) => {
    e.preventDefault();
    if (form.password.length < 6) return toast.error("Password must be at least 6 characters");
    if (form.password !== form.confirm) return toast.error("Passwords do not match");
    try {
      await signup({ full_name:form.full_name, email:form.email, password:form.password });
      toast.success("Account created. Please login.");
      navigate("/login");
    } catch (err) { toast.error(err.response?.data?.detail || "Registration failed"); }
  };
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">💰</div>
        <h1>Create account</h1><p>Start tracking your finances today.</p>
        <form onSubmit={submit}>
          <label>Full name<input value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required /></label>
          <label>Email<input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required /></label>
          <label>Password<input type="password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required /></label>
          <label>Confirm password<input type="password" value={form.confirm} onChange={e=>setForm({...form,confirm:e.target.value})} required /></label>
          <button className="primary full">Create Account</button>
        </form>
        <p className="auth-footer">Already have an account? <Link to="/login">Login</Link></p>
      </div>
    </div>
  );
}
