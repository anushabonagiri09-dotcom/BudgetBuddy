import React, { useEffect, useState } from "react";
import Layout from "../components/Layout";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function Subscription() {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [sending, setSending] = useState(false);

  const load = async () => {
    try { const r = await api.get("/subscriptions/mine"); setRequests(r.data || []); }
    catch (e) { toast.error(e.response?.data?.detail || "Unable to load subscription status"); }
  };
  useEffect(() => { if (user) load(); }, [user]);

  const sendRequest = async () => {
    setSending(true);
    try {
      const r = await api.post("/subscriptions/request", { requested_role: "premium" });
      setRequests((x) => [r.data, ...x]);
      toast.success("Premium request sent to the administrator.");
    } catch (e) { toast.error(e.response?.data?.detail || "Unable to send request"); }
    finally { setSending(false); }
  };

  const pending = requests.find((x) => x.status === "pending");
  return <Layout title="Premium Access">
    <section className="hero-row"><div><span className="eyebrow">ACCOUNT ACCESS</span><h2 className="page-title">Premium subscription</h2><p className="muted">Request Premium access. An administrator reviews the request before your account is upgraded.</p></div></section>
    <div className="panel">
      <div className="panel-head"><div><h3>{user?.role === "premium" ? "Premium is active" : user?.role === "admin" ? "Administrator access" : "Upgrade to Premium"}</h3><p className="muted">Premium includes PDF/Excel report downloads and advanced reporting.</p></div><span className="role-pill">{user?.role === "admin" ? "ADMIN" : user?.role === "premium" ? "PREMIUM" : "STANDARD"}</span></div>
      {user?.role === "student" && !pending && <button className="primary" onClick={sendRequest} disabled={sending}>{sending ? "Sending request..." : "Request Premium Access"}</button>}
      {pending && <div className="premium-note"><strong>Request pending.</strong> Your request has been sent to the administrator for approval.</div>}
      {user?.role === "premium" && <div className="premium-note"><strong>Premium active.</strong> You can now download PDF and Excel reports.</div>}
      {user?.role === "admin" && <div className="premium-note"><strong>Administrator.</strong> Review subscription requests from the Administration menu.</div>}
    </div>
    <div className="panel"><div className="panel-head"><div><h3>Request history</h3><p className="muted">Track your Premium access requests.</p></div></div>
      {requests.length === 0 ? <p className="muted">No Premium request submitted yet.</p> : requests.map((r) => <div className="simple-row" key={r.id}><span>Premium access request <small>{new Date(r.requested_at).toLocaleString()}</small></span><strong>{r.status.toUpperCase()}</strong></div>)}
    </div>
  </Layout>;
}
