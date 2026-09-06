import React, { useEffect, useMemo, useState } from "react";
import { Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
} from "chart.js";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api";
import Layout from "../components/Layout";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement
);

// Palette used across the doughnut, legend and category bars so colors stay in sync
const CATEGORY_COLORS = [
  "#2563eb", // blue
  "#f59e0b", // orange
  "#ef4444", // red
  "#7c3aed", // purple
  "#06b6d4", // cyan
  "#ec4899", // pink
];
const SAVINGS_COLOR = "#334155"; // slate

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function currency(n) {
  return `₹${Number(n || 0).toLocaleString("en-IN")}`;
}

function UserDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/dashboard/")
      .then((res) => {
        setData(res.data);
      })
      .catch((err) => {
        console.error("Dashboard error:", err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalIncome = Number(data?.total_income || 0);
  const totalExpense = Number(data?.total_expense || 0);
  const savings = Math.max(totalIncome - totalExpense, 0);
  const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

  const expenses = data?.expense_summary || [];

  // Build a single combined list (categories + savings) so the doughnut,
  // legend and "Spending by Category" bars all share the same numbers.
  const categories = useMemo(() => {
    return expenses.map((x, i) => ({
      label: x.category || "Other",
      value: Number(x.total || 0),
      color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      percentOfExpense:
        totalExpense > 0 ? (Number(x.total || 0) / totalExpense) * 100 : 0,
    }));
  }, [expenses, totalExpense]);

  const allocationSlices = useMemo(() => {
    // Expense categories only — savings is shown in its own stat card and
    // in the Income vs Expenses chart, so it's left out here to avoid one
    // giant slice swallowing the categories when income >> expenses.
    return categories.map((c) => ({
      ...c,
      percentOfIncome: c.percentOfExpense,
    }));
  }, [categories]);

  const allocationData = useMemo(() => {
    return {
      labels: allocationSlices.map((s) => s.label),
      datasets: [
        {
          data: allocationSlices.map((s) => s.value),
          backgroundColor: allocationSlices.map((s) => s.color),
          borderWidth: 0,
        },
      ],
    };
  }, [allocationSlices]);

  const allocationOptions = {
    plugins: { legend: { display: false } },
    cutout: "65%",
    maintainAspectRatio: false,
  };

  const incomeExpenseData = useMemo(() => {
    return {
      labels: ["Income", "Expenses"],
      datasets: [
        {
          data: [totalIncome, totalExpense],
          backgroundColor: ["#10b981", "#ef4444"],
          borderRadius: 6,
          maxBarThickness: 90,
        },
      ],
    };
  }, [totalIncome, totalExpense]);

  const incomeExpenseOptions = {
    plugins: { legend: { display: false } },
    maintainAspectRatio: false,
    scales: {
      y: {
        beginAtZero: true,
        ticks: { callback: (v) => `₹${v.toLocaleString("en-IN")}` },
      },
    },
  };

  const now = new Date();
  const monthLabel = `${MONTH_NAMES[now.getMonth()]} ${now.getFullYear()}`;
  const firstName = (user?.name || user?.first_name || "there").split(" ")[0];

  if (loading) {
    return (
      <Layout>
        <div className="p-6 text-gray-500">Loading dashboard...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Good morning, {firstName} 👋
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Here&apos;s your financial overview for {monthLabel}
            </p>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg px-4 py-2 text-sm font-medium text-gray-700 shadow-sm">
            {monthLabel}
          </div>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-6">
          <StatCard
            label="Total Income"
            value={currency(totalIncome)}
            sub="This Month"
            valueClass="text-green-600"
            iconBg="bg-green-100"
            icon="₹"
          />
          <StatCard
            label="Total Expenses"
            value={currency(totalExpense)}
            sub="This Month"
            valueClass="text-red-500"
            iconBg="bg-red-100"
            icon="₹"
          />
          <StatCard
            label="Savings / Balance"
            value={currency(savings)}
            sub="This Month"
            valueClass="text-green-600"
            iconBg="bg-green-100"
            icon="🏦"
          />
          <StatCard
            label="Savings Rate"
            value={`${savingsRate.toFixed(2)}%`}
            sub="Of Income"
            valueClass="text-blue-600"
            iconBg="bg-blue-100"
            icon="%"
          />
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-lg font-bold text-gray-900">Money Allocation</h2>
            <p className="text-sm text-gray-500 mb-4">
              How this month's expenses break down
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              <div style={{ height: "220px", width: "220px" }} className="shrink-0">
                <Doughnut data={allocationData} options={allocationOptions} />
              </div>

              <ul className="w-full space-y-2">
                {allocationSlices.map((s) => (
                  <li key={s.label} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-gray-700">
                      <span
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                      {s.label}
                    </span>
                    <span className="text-gray-500">
                      {currency(s.value)} ({s.percentOfIncome.toFixed(1)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow p-5">
            <h2 className="text-lg font-bold text-gray-900">Income vs Expenses</h2>
            <p className="text-sm text-gray-500 mb-4">
              Current-month cash flow comparison
            </p>
            <div style={{ height: "280px" }}>
              <Bar data={incomeExpenseData} options={incomeExpenseOptions} />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, sub, valueClass, iconBg, icon }) {
  return (
    <div className="bg-white rounded-xl shadow p-5 flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${iconBg} ${valueClass}`}
      >
        <span className="font-bold">{icon}</span>
      </div>
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <h2 className={`text-2xl font-bold ${valueClass}`}>{value}</h2>
        <p className="text-gray-400 text-xs mt-1">{sub}</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (user?.role === "admin") {
    // Admins get the real, fully-featured admin dashboard at /admin
    // (charts, user management, premium requests, notifications, etc.)
    // instead of this page's plain user view.
    return <Navigate to="/admin" replace />;
  }

  return <UserDashboard />;
}