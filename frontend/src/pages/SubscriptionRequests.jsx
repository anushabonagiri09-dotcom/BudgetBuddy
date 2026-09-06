import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function SubscriptionRequests() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(null);
  const load = async () => { try { const r = await api.get("/subscriptions/pending"); setItems(r.data || []); } catch (e) { toast.error(e.response?.data?.detail || "Unable to load requests"); } };
  useEffect(() => { if (user?.role === "admin") load(); }, [user]);
  const decide = async (id, action) => { setBusy(id); try { await api.patch(`/subscriptions/${id}`, { action }); setItems((x) => x.filter((i) => i.id !== id)); toast.success(action === "approve" ? "Premium access approved." : "Request rejected."); } catch (e) { toast.error(e.response?.data?.detail || "Unable to update request"); } finally { setBusy(null); } };
  if (user?.role !== "admin") return <Layout title="Subscription Requests"><div className="panel"><h3>Admin access required</h3></div></Layout>;
  return <Layout><section className="hero-row"><div><span className="eyebrow">ADMINISTRATION</span><h2 className="page-title">Premium subscription requests</h2><p className="muted">Approve or reject Premium access requests. Approval automatically changes the selected user's role to Premium.</p></div></section><div className="panel"><div className="panel-head"><div><h3>Pending requests</h3></div><span className="statement-count">{items.length} pending</span></div>{items.length === 0 ? <p className="muted">No pending requests.</p> : <div className="table-wrap"><table className="statement-table"><thead><tr><th>User</th><th>Email</th><th>Requested</th><th>Action</th></tr></thead><tbody>{items.map((item) => <tr key={item.id}><td><strong>{item.user_name || `User #${item.user_id}`}</strong></td><td>{item.user_email}</td><td>{new Date(item.requested_at).toLocaleString()}</td><td><div className="quick-actions"><button className="primary" disabled={busy===item.id} onClick={() => decide(item.id,"approve")}>Approve</button><button className="secondary" disabled={busy===item.id} onClick={() => decide(item.id,"reject")}>Reject</button></div></td></tr>)}</tbody></table></div>}</div></Layout>;
}
