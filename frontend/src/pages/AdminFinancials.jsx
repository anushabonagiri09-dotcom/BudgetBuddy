import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { FaWallet, FaMoneyBillWave, FaPiggyBank, FaUniversity, FaBullseye, FaSyncAlt, FaUsers } from "react-icons/fa";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import api from "../api";
import { useAuth } from "../context/AuthContext";

const money = (v) => `₹${Number(v || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Platform-wide totals only -- no user is named or broken out individually
// anywhere on this page. That keeps every account's financial activity
// isolated from administrators; only combined figures are shown.
const configs = {
  "/admin/income": {
    title: "All Income Overview",
    icon: FaWallet,
    description: "Combined income across every account this month.",
    primaryLabel: "Total Income",
    primaryValue: (s) => s.total_income,
    countLabel: "Income Records",
    countValue: (s) => s.income_count,
  },
  "/admin/expenses": {
    title: "All Expense Overview",
    icon: FaMoneyBillWave,
    description: "Combined expenses across every account this month.",
    primaryLabel: "Total Expenses",
    primaryValue: (s) => s.total_expense,
    countLabel: "Expense Records",
    countValue: (s) => s.expense_count,
  },
  "/admin/budgets": {
    title: "All Budgets Overview",
    icon: FaPiggyBank,
    description: "Combined budget limits across every account this month.",
    primaryLabel: "Total Budget",
    primaryValue: (s) => s.total_budget,
    countLabel: "Budgets Set",
    countValue: (s) => s.budget_count,
  },
  "/admin/bank-accounts": {
    title: "All Bank Accounts Overview",
    icon: FaUniversity,
    description: "Combined linked-account balances across every account.",
    primaryLabel: "Total Bank Balance",
    primaryValue: (s) => s.total_bank_balance,
    countLabel: "Linked Accounts",
    countValue: (s) => s.bank_account_count,
  },
  "/admin/goals": {
    title: "All Savings Goals Overview",
    icon: FaBullseye,
    description: "Combined savings goals across every account.",
    primaryLabel: "Net Balance",
    primaryValue: (s) => s.net_balance,
    countLabel: "Goals Set",
    countValue: (s) => s.goal_count,
  },
};

export default function AdminFinancials() {
  const { user } = useAuth();
  const location = useLocation();
  const config = configs[location.pathname] || configs["/admin/income"];
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const response = await api.get("/admin/financials");
      setSummary(response.data?.summary || {});
    } catch (error) {
      toast.error(error.response?.data?.detail || "Unable to load admin financial details");
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (user?.role === "admin") load();
  }, [user?.role]);

  if (user?.role !== "admin") {
    return <Layout><div className="panel"><h3>Admin access required</h3><p className="muted">Only administrators can view these details.</p></div></Layout>;
  }

  const s = summary || {};

  return (
    <Layout>
      <section className="statement-hero">
        <div>
          <span className="eyebrow">ADMINISTRATION • PLATFORM TOTALS ONLY</span>
          <h2>{config.title}</h2>
          <p>{config.description} No individual user's numbers are shown or linked to their name here — this page reports combined platform totals only.</p>
        </div>
        <button className="secondary" onClick={load} disabled={loading}><FaSyncAlt /> Refresh</button>
      </section>

      {loading ? <p className="muted">Loading details...</p> : (
        <div className="stats-grid">
          <div className="stat-card green">
            <div className="stat-icon"><config.icon /></div>
            <div><p>{config.primaryLabel}</p><h2>{money(config.primaryValue(s))}</h2><small>{s.total_users || 0} accounts • current month</small></div>
          </div>
          <div className="stat-card blue">
            <div className="stat-icon"><FaPiggyBank /></div>
            <div><p>{config.countLabel}</p><h2>{config.countValue(s) || 0}</h2><small>Across all accounts</small></div>
          </div>
          <div className="stat-card purple">
            <div className="stat-icon"><FaUsers /></div>
            <div><p>Total Accounts</p><h2>{s.total_users || 0}</h2><small>{s.premium_users || 0} Premium • {s.standard_users || 0} Standard</small></div>
          </div>
        </div>
      )}
    </Layout>
  );
}
