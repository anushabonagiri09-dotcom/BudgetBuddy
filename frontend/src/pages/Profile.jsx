import React, { useEffect, useState } from "react";
import { FaEnvelope, FaLock, FaPhone, FaShieldAlt, FaUser, FaWallet, FaEdit, FaCheckCircle } from "react-icons/fa";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const roleLabel = (role) => {
  if (role === "admin") return "Administrator";
  if (role === "premium") return "Premium member";
  return "Standard member";
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const [profile, setProfile] = useState({ full_name: "", phone: "", monthly_income: "", currency: "INR" });
  const [password, setPassword] = useState({ current_password: "", new_password: "", confirm_password: "" });
  const [saving, setSaving] = useState(false);
  const [changing, setChanging] = useState(false);

  useEffect(() => {
    setProfile({
      full_name: user?.full_name || "",
      phone: user?.phone || "",
      monthly_income: user?.monthly_income ?? "",
      currency: user?.currency || "INR",
    });
  }, [user]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      await api.put("/auth/profile", {
        full_name: profile.full_name,
        phone: profile.phone || null,
        monthly_income: Number(profile.monthly_income || 0),
        currency: profile.currency,
      });
      await refreshUser();
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    if (password.new_password !== password.confirm_password) {
      toast.error("New passwords do not match");
      return;
    }
    setChanging(true);
    try {
      await api.post("/auth/change-password", {
        current_password: password.current_password,
        new_password: password.new_password,
      });
      setPassword({ current_password: "", new_password: "", confirm_password: "" });
      setPasswordOpen(false);
      toast.success("Password changed successfully");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to change password");
    } finally {
      setChanging(false);
    }
  };

  return (
    <Layout>
      <section className="statement-hero profile-hero">
        <div>
          <span className="eyebrow">ACCOUNT & SECURITY</span>
          <h2>My Profile</h2>
          <p>Review your account details, edit your profile information and manage your password securely.</p>
        </div>
        <div className="profile-hero-actions">
          <button className="secondary hero-action" onClick={() => setEditing((value) => !value)}>
            <FaEdit /> {editing ? "Close Editor" : "Edit Profile"}
          </button>
          <button className="hero-action hero-password" onClick={() => setPasswordOpen((value) => !value)}>
            <FaLock /> {passwordOpen ? "Close Password" : "Change Password"}
          </button>
        </div>
      </section>

      <section className="profile-overview-card panel">
        <div className="profile-avatar-large"><FaUser /></div>
        <div>
          <span className="eyebrow">ACCOUNT HOLDER</span>
          <h3>{user?.full_name || "BudgetBuddy User"}</h3>
          <p>{user?.email || "—"}</p>
          <span className="role-pill profile-role-pill">{roleLabel(user?.role)}</span>
        </div>
        <div className="profile-overview-status"><FaCheckCircle /> Account active</div>
      </section>

      {editing ? (
        <section className="panel profile-edit-panel">
          <div className="panel-head">
            <div>
              <h3><FaEdit /> Edit Profile</h3>
              <p className="muted">Update the details stored in your BudgetBuddy profile.</p>
            </div>
          </div>
          <form className="profile-form" onSubmit={saveProfile}>
            <label>Full name<input required minLength={2} value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></label>
            <label>Email<input value={user?.email || ""} readOnly className="readonly-input" /></label>
            <label><span><FaPhone /> Phone number</span><input type="tel" maxLength={30} value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="+91 98765 43210" /></label>
            <label><span><FaWallet /> Monthly income</span><input type="number" min="0" step="0.01" value={profile.monthly_income} onChange={(e) => setProfile({ ...profile, monthly_income: e.target.value })} /></label>
            <label>Currency<select value={profile.currency} onChange={(e) => setProfile({ ...profile, currency: e.target.value })}><option value="INR">INR — Indian Rupee</option><option value="USD">USD — US Dollar</option><option value="GBP">GBP — British Pound</option><option value="EUR">EUR — Euro</option></select></label>
            <label>Role<input value={roleLabel(user?.role)} readOnly className="readonly-input" /></label>
            <div className="profile-edit-actions">
              <button type="button" className="secondary" onClick={() => setEditing(false)}>Cancel</button>
              <button type="submit" className="primary" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
            </div>
          </form>
        </section>
      ) : (
        <section className="panel">
          <div className="panel-head">
            <div>
              <h3>Profile Details</h3>
              <p className="muted">Your current BudgetBuddy account information.</p>
            </div>
            <button className="secondary" onClick={() => setEditing(true)}><FaEdit /> Edit Profile</button>
          </div>
          <div className="profile-details-grid">
            <div><span>Full name</span><strong>{user?.full_name || "Not provided"}</strong></div>
            <div><span>Email</span><strong>{user?.email || "—"}</strong></div>
            <div><span>Phone number</span><strong>{user?.phone || "Not added"}</strong></div>
            <div><span>Monthly income</span><strong>{user?.currency || "INR"} {Number(user?.monthly_income || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</strong></div>
            <div><span>Currency</span><strong>{user?.currency || "INR"}</strong></div>
            <div><span>Access level</span><strong>{roleLabel(user?.role)}</strong></div>
            <div><span>Account ID</span><strong>#{user?.id || "—"}</strong></div>
            <div><span>Account created</span><strong>{user?.created_at ? new Date(user.created_at).toLocaleDateString() : "Available in account records"}</strong></div>
          </div>
        </section>
      )}

      {passwordOpen && (
        <section className="panel password-panel">
          <div className="panel-head">
            <div>
              <h3><FaLock /> Change Password</h3>
              <p className="muted">Use a new password of at least 6 characters.</p>
            </div>
          </div>
          <form className="profile-form password-form" onSubmit={changePassword}>
            <label>Current password<input type="password" required value={password.current_password} onChange={(e) => setPassword({ ...password, current_password: e.target.value })} /></label>
            <label>New password<input type="password" required minLength={6} value={password.new_password} onChange={(e) => setPassword({ ...password, new_password: e.target.value })} /></label>
            <label>Confirm new password<input type="password" required minLength={6} value={password.confirm_password} onChange={(e) => setPassword({ ...password, confirm_password: e.target.value })} /></label>
            <div className="profile-edit-actions">
              <button type="button" className="secondary" onClick={() => setPasswordOpen(false)}>Cancel</button>
              <button className="primary" disabled={changing}>{changing ? "Updating..." : "Update Password"}</button>
            </div>
          </form>
          <div className="security-note"><FaShieldAlt /><div><strong>Account security</strong><br />Your new password will be required on the next login.</div></div>
        </section>
      )}
    </Layout>
  );
}
