import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Income from "./pages/Income";
import Expense from "./pages/Expense";
import Budget from "./pages/Budget";
import BankAccounts from "./pages/BankAccounts";
import Goals from "./pages/Goals";
import Notifications from "./pages/Notifications";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import AdminUsers from "./pages/AdminUsers";
import AdminDashboard from "./pages/AdminDashboard";
import Subscription from "./pages/Subscription";
import SubscriptionRequests from "./pages/SubscriptionRequests";
import Reports from "./pages/Reports";
import AdminFinancials from "./pages/AdminFinancials";

export default function App() {
  const privateRoute = (element) => <ProtectedRoute>{element}</ProtectedRoute>;

  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Register />} />

      <Route path="/dashboard" element={privateRoute(<Dashboard />)} />
      <Route path="/income" element={privateRoute(<Income />)} />
      <Route path="/expenses" element={privateRoute(<Expense />)} />
      <Route path="/budget" element={privateRoute(<Budget />)} />
      <Route path="/bank-accounts" element={privateRoute(<BankAccounts />)} />
      <Route path="/goals" element={privateRoute(<Goals />)} />
      <Route path="/reports" element={privateRoute(<Reports />)} />
      <Route path="/subscription" element={privateRoute(<Subscription />)} />
      <Route path="/notifications" element={privateRoute(<Notifications />)} />
      <Route path="/profile" element={privateRoute(<Profile />)} />
      <Route path="/settings" element={privateRoute(<Settings />)} />

      <Route path="/admin" element={privateRoute(<AdminDashboard />)} />
      <Route path="/admin/subscriptions" element={privateRoute(<SubscriptionRequests />)} />
      <Route path="/admin/users" element={privateRoute(<AdminUsers />)} />
      <Route path="/admin/income" element={privateRoute(<AdminFinancials />)} />
      <Route path="/admin/expenses" element={privateRoute(<AdminFinancials />)} />
      <Route path="/admin/budgets" element={privateRoute(<AdminFinancials />)} />
      <Route path="/admin/bank-accounts" element={privateRoute(<AdminFinancials />)} />
      <Route path="/admin/goals" element={privateRoute(<AdminFinancials />)} />

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
