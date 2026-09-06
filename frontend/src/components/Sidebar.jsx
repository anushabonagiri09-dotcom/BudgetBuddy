import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaMoneyBillWave,
  FaWallet,
  FaBullseye,
  FaUniversity,
  FaSignOutAlt,
  FaFileAlt,
  FaCrown,
  FaUserShield,
  FaPiggyBank,
  FaUsers,
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

const userLinks = [
  ["/dashboard", "Dashboard", FaHome],
  ["/income", "Income", FaWallet],
  ["/expenses", "Expenses", FaMoneyBillWave],
  ["/budget", "Budgets", FaPiggyBank],
  ["/goals", "Savings Goals", FaBullseye],
  ["/bank-accounts", "Bank Accounts", FaUniversity],
  ["/reports", "Reports", FaFileAlt],
];

const adminLinks = [
  ["/admin", "Admin Dashboard", FaUserShield],
  ["/admin/users", "User Management", FaUsers],
  ["/admin/income", "All Income", FaWallet],
  ["/admin/expenses", "All Expenses", FaMoneyBillWave],
  ["/admin/budgets", "All Budgets", FaPiggyBank],
  ["/admin/bank-accounts", "Bank Accounts", FaUniversity],
  ["/admin/goals", "Savings Goals", FaBullseye],
  ["/reports", "Reports", FaFileAlt],
];

export default function Sidebar() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const links = isAdmin ? adminLinks : userLinks;

  const roleLabel = isAdmin
    ? "Administrator"
    : user?.role === "premium"
    ? "Premium member"
    : "Standard member";

  return (
    <aside className="sidebar">
      <div className="brand">BudgetBuddy</div>

      <div className="nav-section-label">
        {isAdmin ? "Administration" : "Workspace"}
      </div>

      <nav>
        {links.map(([to, label, Icon]) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `side-link ${isActive ? "active" : ""}`
            }
          >
            <Icon /> <span>{label}</span>
          </NavLink>
        ))}

        {!isAdmin && (
          <NavLink
            to="/subscription"
            className={({ isActive }) =>
              `side-link ${isActive ? "active" : ""}`
            }
          >
            <FaCrown />
            <span>
              {user?.role === "premium"
                ? "Premium Access"
                : "Upgrade to Premium"}
            </span>
          </NavLink>
        )}
      </nav>

      <div className="sidebar-bottom">
        <div className="role-card">
          <span className="eyebrow">ACCOUNT ACCESS</span>
          <strong>{roleLabel}</strong>
          <p>{user?.email || "Secure account"}</p>
        </div>

        <NavLink to="/profile" className="side-link">
          👤 <span>Profile</span>
        </NavLink>

        <NavLink to="/settings" className="side-link">
          ⚙️ <span>Settings</span>
        </NavLink>

        <button
          className="logout-link"
          onClick={() => {
            logout();
            navigate("/login");
          }}
        >
          <FaSignOutAlt /> <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
