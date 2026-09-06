import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function AdminUsers() {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get("/auth/users");
      setUsers(response.data || []);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === "admin") loadUsers();
  }, [user]);

  const changeRole = async (userId, role) => {
    setSavingId(userId);
    try {
      const response = await api.patch(`/auth/users/${userId}/role`, { role });
      setUsers((current) => current.map((item) => item.id === userId ? response.data : item));
      toast.success("User access updated");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to update user role");
    } finally {
      setSavingId(null);
    }
  };


  const deleteUser = async (userId, email) => {
    const confirmed = window.confirm(
      `Delete the account for ${email}?\n\nThis permanently removes the user's account and their stored financial data. This action cannot be undone.`
    );

    if (!confirmed) return;

    setDeletingId(userId);

    try {
      await api.delete(`/auth/users/${userId}`);
      setUsers((current) => current.filter((item) => item.id !== userId));
      toast.success("User account deleted");
    } catch (error) {
      toast.error(
        error.response?.data?.detail || "Unable to delete user account"
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (user?.role !== "admin") {
    return <Layout title="User Management"><div className="panel"><h3>Admin access required</h3><p className="muted">Only administrators can manage account roles.</p></div></Layout>;
  }

  return (
    <Layout>
      <section className="hero-row">
        <div>
          <span className="eyebrow">ADMINISTRATION</span>
          <h2 className="page-title">User access management</h2>
          <p className="muted">Assign Standard, Premium or Administrator access. Changes apply the next time the user refreshes their session.</p>
        </div>
      </section>

      <div className="panel">
        <div className="panel-head">
          <div><h3>Accounts</h3><p className="muted">Premium and Admin features are controlled by the account role.</p></div>
          <span className="statement-count">{users.length} users</span>
        </div>
        {loading ? <p className="muted">Loading users...</p> : (
          <div className="table-wrap">
            <table className="statement-table">
              <thead><tr><th>User</th><th>Email</th><th>Current access</th><th>Change access</th><th>Account</th></tr></thead>
              <tbody>
                {users.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.full_name || "Unnamed user"}</strong><small>User #{item.id}</small></td>
                    <td>{item.email}</td>
                    <td><span className="role-pill">{item.role === "admin" ? "ADMIN" : item.role === "premium" ? "PREMIUM" : "STANDARD"}</span></td>
                    <td>
                      <select
                        value={item.role}
                        disabled={savingId === item.id || item.id === user.id}
                        onChange={(event) => changeRole(item.id, event.target.value)}
                        title={item.id === user.id ? "Your own role cannot be changed here" : "Change user access"}
                      >
                        <option value="student">Standard</option>
                        <option value="premium">Premium</option>
                        <option value="admin">Admin</option>
                      </select>
                      {item.id === user.id && <small className="muted">Current admin account</small>}
                    </td>
                    <td>
                      {item.id === user.id ? (
                        <span className="muted">Protected</span>
                      ) : (
                        <button
                          type="button"
                          className="danger-button"
                          disabled={deletingId === item.id}
                          onClick={() => deleteUser(item.id, item.email)}
                        >
                          {deletingId === item.id ? "Deleting..." : "Delete Account"}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
