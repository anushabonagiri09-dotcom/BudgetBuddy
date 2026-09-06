import React, { useEffect, useState } from "react";
import { FaBell, FaShieldAlt } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";
import { getNotifications } from "../services/notifications";
import { useNavigate } from "react-router-dom";

export default function Navbar() {
  const { user } = useAuth();
  const [unread, setUnread] = useState(0);
  const navigate = useNavigate();
  useEffect(() => {
    getNotifications().then(r => setUnread(r.data.filter(n => !n.is_read).length)).catch(() => {});
  }, []);
  const role = user?.role === "admin" ? "Admin" : user?.role === "premium" ? "Premium" : "Standard";
  return (
    <header className="topbar">
      <div>
        <h1>Good to see you, {user?.full_name || "Buddy"}</h1>
        <p>Stay on top of your money with a clear, secure financial workspace.</p>
      </div>
      <div className="quick-actions">
        <span className="status success"><FaShieldAlt style={{marginRight:5}} /> {role}</span>
        <button className="icon-button" onClick={() => navigate("/notifications")} title="Notifications" aria-label="Notifications">
          <FaBell />{unread > 0 && <span className="badge">{unread}</span>}
        </button>
      </div>
    </header>
  );
}
