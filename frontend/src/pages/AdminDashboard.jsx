import React, { useEffect, useMemo, useState } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart as ChartJS,
  Legend,
  LinearScale,
  Tooltip,
} from "chart.js";
import {
  FaArrowDown,
  FaArrowUp,
  FaBalanceScale,
  FaChartBar,
  FaChartPie,
  FaCheck,
  FaCrown,
  FaSyncAlt,
  FaTrash,
  FaUsers,
} from "react-icons/fa";
import { toast } from "react-toastify";
import Layout from "../components/Layout";
import api from "../api";
import { useAuth } from "../context/AuthContext";

ChartJS.register(
  ArcElement,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend
);

const money = (v) =>
  `₹${Number(v || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 2,
  })}`;

const roleLabel = (role) =>
  role === "admin"
    ? "ADMIN"
    : role === "premium"
    ? "PREMIUM"
    : "STANDARD";

const palette = [
  "#2563eb",
  "#f59e0b",
  "#ef4444",
  "#7c3aed",
  "#06b6d4",
  "#10b981",
  "#ec4899",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

export default function AdminDashboard() {
  const { user } = useAuth();

  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [financial, setFinancial] = useState(null);

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");

  const load = async () => {
    setLoading(true);

    const [usersResult, requestsResult, financialResult] =
      await Promise.allSettled([
        api.get("/auth/users"),
        api.get("/subscriptions/pending"),
        api.get("/admin/financials"),
      ]);

    // Users
    if (usersResult.status === "fulfilled") {
      setUsers(usersResult.value.data || []);
    }

    // Premium requests
    if (requestsResult.status === "fulfilled") {
      setRequests(requestsResult.value.data || []);
    }

    // Financial information
    if (financialResult.status === "fulfilled") {
      setFinancial(financialResult.value.data || {});
    }

    const failed = [
      usersResult,
      requestsResult,
      financialResult,
    ].find((result) => result.status === "rejected");

    if (failed) {
      toast.error(
        failed.reason?.response?.data?.detail ||
          "Some administrator data failed to load"
      );
    }

    setLoading(false);
  };

  useEffect(() => {
    if (user?.role === "admin") {
      load();
    }
  }, [user?.role]);

  // ------------------------------------------------------------
  // USER STATISTICS
  // ------------------------------------------------------------

  const stats = useMemo(
    () => ({
      total: users.length,
      premium: users.filter((item) => item.role === "premium").length,
      standard: users.filter((item) => item.role === "student").length,
      admins: users.filter((item) => item.role === "admin").length,
    }),
    [users]
  );

  // ------------------------------------------------------------
  // FINANCIAL DATA FOR ADMIN CHARTS
  // ------------------------------------------------------------

  const categories = financial?.summary?.expense_categories || [];

  const totalIncome = Number(
    financial?.summary?.total_income || 0
  );

  const totalExpense = Number(
    financial?.summary?.total_expense || 0
  );

  const savingsBalance = Math.max(
    totalIncome - totalExpense,
    0
  );

  // ------------------------------------------------------------
  // MONEY ALLOCATION
  // ------------------------------------------------------------

  const allocationRows = categories
    .map((x) => ({
      label: x.category,
      value: Number(x.total || 0),
    }))
    .filter((x) => x.value > 0);

  const allocationChart = useMemo(
    () => ({
      labels: allocationRows.map((x) => x.label),

      datasets: [
        {
          data: allocationRows.map((x) => x.value),

          backgroundColor: allocationRows.map(
            (_, i) => palette[i % palette.length]
          ),

          borderColor: "#fff",
          borderWidth: 3,
          hoverOffset: 8,
        },
      ],
    }),
    [financial]
  );

  // ------------------------------------------------------------
  // INCOME VS EXPENSES
  // ------------------------------------------------------------

  const incomeExpenseChart = useMemo(
    () => ({
      labels: ["Income", "Expenses"],

      datasets: [
        {
          data: [totalIncome, totalExpense],

          backgroundColor: ["#10b981", "#ef4444"],

          borderRadius: 10,
          borderSkipped: false,
          barThickness: 58,
        },
      ],
    }),
    [totalIncome, totalExpense]
  );

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: "55%",

    plugins: {
      legend: {
        position: "bottom",

        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
          },
        },
      },

      tooltip: {
        callbacks: {
          label: (c) => ` ${c.label}: ${money(c.raw)}`,
        },
      },
    },
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,

    plugins: {
      legend: {
        display: false,
      },

      tooltip: {
        callbacks: {
          label: (c) => ` ${money(c.raw)}`,
        },
      },
    },

    scales: {
      y: {
        beginAtZero: true,

        ticks: {
          callback: (v) =>
            `₹${Number(v).toLocaleString("en-IN")}`,
        },
      },
    },
  };

  // ------------------------------------------------------------
  // APPROVE / REJECT PREMIUM REQUEST
  // ------------------------------------------------------------

  const decideRequest = async (requestId, action) => {
    setBusy(`request-${requestId}`);

    try {
      await api.patch(`/subscriptions/${requestId}`, {
        action,
      });

      toast.success(
        action === "approve"
          ? "Premium access approved."
          : "Premium request rejected."
      );

      await load();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to update subscription request"
      );
    } finally {
      setBusy("");
    }
  };

  // ------------------------------------------------------------
  // CHANGE USER ROLE
  // ------------------------------------------------------------

  const changeRole = async (userId, role) => {
    setBusy(`role-${userId}`);

    try {
      await api.patch(`/auth/users/${userId}/role`, {
        role,
      });

      toast.success(
        `${roleLabel(role)} access assigned successfully.`
      );

      await load();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to update user access"
      );
    } finally {
      setBusy("");
    }
  };

  // ------------------------------------------------------------
  // DELETE USER
  // ------------------------------------------------------------

  const deleteUser = async (userId, email) => {
    if (
      !window.confirm(
        `Delete ${email}? This permanently removes the account and all stored financial data.`
      )
    ) {
      return;
    }

    setBusy(`delete-${userId}`);

    try {
      await api.delete(`/auth/users/${userId}`);

      setUsers((current) =>
        current.filter((x) => x.id !== userId)
      );

      toast.success("User account deleted successfully.");

      await load();
    } catch (error) {
      toast.error(
        error.response?.data?.detail ||
          "Unable to delete user account"
      );
    } finally {
      setBusy("");
    }
  };

  // ------------------------------------------------------------
  // ACCESS CHECK
  // ------------------------------------------------------------

  if (user?.role !== "admin") {
    return (
      <Layout title="Admin Dashboard">
        <div className="panel">
          <h3>Admin access required</h3>

          <p className="muted">
            Only administrators can access this page.
          </p>
        </div>
      </Layout>
    );
  }

  // ------------------------------------------------------------
  // ADMIN DASHBOARD
  // ------------------------------------------------------------

  return (
    <Layout>
      <section className="hero-row admin-dashboard-hero">
        <div>
          <span className="eyebrow">
            ADMINISTRATION • FINANCIAL CONTROL CENTER
          </span>

          <h2 className="page-title">
            Good morning, {user?.full_name || "Admin"} 👋
          </h2>

          <p className="muted">
            Monitor platform finances, manage users and handle
            Premium access requests.
          </p>
        </div>

        <button
          className="secondary"
          onClick={load}
          disabled={loading}
        >
          <FaSyncAlt />

          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </section>

      {/* ======================================================
          ADMIN STATISTICS
      ====================================================== */}

      <div className="stats-grid admin-finance-stats">
        <div className="stat-card green">
          <div className="stat-icon">
            <FaArrowUp />
          </div>

          <div>
            <p>Total Income</p>

            <h2>{money(totalIncome)}</h2>

            <small>
              All users •{" "}
              {financial?.period_label || "current month"}
            </small>
          </div>
        </div>

        <div className="stat-card red">
          <div className="stat-icon">
            <FaArrowDown />
          </div>

          <div>
            <p>Total Expenses</p>

            <h2>{money(totalExpense)}</h2>

            <small>
              All users •{" "}
              {financial?.period_label || "current month"}
            </small>
          </div>
        </div>

        <div className="stat-card blue">
          <div className="stat-icon">
            <FaBalanceScale />
          </div>

          <div>
            <p>Savings / Balance</p>

            <h2>{money(savingsBalance)}</h2>

            <small>Income minus expenses</small>
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-icon">
            <FaUsers />
          </div>

          <div>
            <p>Total Users</p>

            <h2>{stats.total}</h2>

            <small>
              {stats.premium} Premium • {stats.standard} Standard
            </small>
          </div>
        </div>
      </div>

      {/* ======================================================
          CHARTS
      ====================================================== */}

      <div className="chart-grid admin-main-charts">
        {/* MONEY ALLOCATION */}

        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <h3>
                <FaChartPie /> Money Allocation
              </h3>

              <p className="muted">
                All users: expense categories this month.
              </p>
            </div>
          </div>

          <div className="chart-box">
            {allocationRows.length ? (
              <Doughnut
                data={allocationChart}
                options={pieOptions}
              />
            ) : (
              <div className="chart-empty">
                <strong>No financial activity</strong>

                <span>
                  Add income or expenses from user accounts.
                </span>
              </div>
            )}
          </div>
        </section>

        {/* INCOME VS EXPENSES */}

        <section className="panel chart-panel">
          <div className="panel-head">
            <div>
              <h3>
                <FaChartBar /> Income vs Expenses
              </h3>

              <p className="muted">
                Current-month cash flow across every user.
              </p>
            </div>
          </div>

          <div className="chart-box graph-box">
            {totalIncome || totalExpense ? (
              <Bar
                data={incomeExpenseChart}
                options={barOptions}
              />
            ) : (
              <div className="chart-empty">
                <strong>No cash-flow data</strong>

                <span>
                  No income or expense records are available.
                </span>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* ======================================================
          PENDING PREMIUM REQUESTS
          
          ALL USERS FINANCIAL SUMMARY REMOVED
          ADMINISTRATOR NOTIFICATIONS REMOVED
      ====================================================== */}

      <section className="panel admin-request-panel">
        <div className="panel-head">
          <div>
            <h3>
              <FaCrown /> Pending Premium Requests
            </h3>

            <p className="muted">
              Requests submitted by users appear here.
            </p>
          </div>

          <span className="statement-count">
            {requests.length} pending
          </span>
        </div>

        {requests.length === 0 ? (
          <div className="admin-empty">
            <FaCheck />

            <div>
              <strong>No pending requests</strong>

              <p className="muted">
                New Premium requests will appear here.
              </p>
            </div>
          </div>
        ) : (
          requests.map((request) => (
            <div
              className="admin-request-row"
              key={request.id}
            >
              <div>
                <strong>
                  {request.user_name ||
                    request.user_email ||
                    `User #${request.user_id}`}
                </strong>

                <span>
                  {request.user_email} •{" "}
                  {request.requested_at
                    ? new Date(
                        request.requested_at
                      ).toLocaleString()
                    : "Pending"}
                </span>
              </div>

              <div className="admin-request-actions">
                <button
                  className="primary small"
                  disabled={
                    busy === `request-${request.id}`
                  }
                  onClick={() =>
                    decideRequest(
                      request.id,
                      "approve"
                    )
                  }
                >
                  <FaCheck />

                  {busy === `request-${request.id}`
                    ? "Processing..."
                    : "Approve"}
                </button>

                <button
                  className="secondary small"
                  disabled={
                    busy === `request-${request.id}`
                  }
                  onClick={() =>
                    decideRequest(
                      request.id,
                      "reject"
                    )
                  }
                >
                  Reject
                </button>
              </div>
            </div>
          ))
        )}
      </section>
    </Layout>
  );
}