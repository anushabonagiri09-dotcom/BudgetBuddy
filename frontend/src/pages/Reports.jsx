import React, { useMemo, useState } from "react";
import { toast } from "react-toastify";
import api from "../api";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { FaFilePdf, FaFileExcel, FaShieldAlt } from "react-icons/fa";

const months = ["January","February","March","April","May","June","July","August","September","October","November","December"];

export default function Reports() {
  const { user } = useAuth();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [downloading, setDownloading] = useState("");
  const canExport = user?.role === "premium" || user?.role === "admin";
  const isAdmin = user?.role === "admin";
  const period = useMemo(() => `${year}-${String(month).padStart(2, "0")}`, [month, year]);

  const downloadReport = async (type) => {
    if (!canExport) {
      toast.info("Premium or Admin access is required to download reports.");
      return;
    }
    setDownloading(type);
    try {
      const params = new URLSearchParams({ month: String(month), year: String(year) });
      const response = await api.get(`/reports/export/${type}?${params.toString()}`, { responseType: "blob" });
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = `budgetbuddy-report-${period}.${type === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      toast.success(`${type === "pdf" ? "PDF" : "Excel"} report downloaded`);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Report download failed");
    } finally {
      setDownloading("");
    }
  };

  return (
    <Layout>
      <section className="hero-row"><div><span className="eyebrow">FINANCIAL REPORTING</span><h2 className="page-title">Reports</h2><p className="muted">Generate an official BudgetBuddy report for the selected reporting period.</p></div></section>

      <div className="panel">
        <div className="panel-head"><div><h3>Report Period</h3><p className="muted">Choose the month and year to export.</p></div><span className="role-pill">{isAdmin ? "ADMIN" : user?.role === "premium" ? "PREMIUM" : "STANDARD"}</span></div>
        <div className="form-grid">
          <label>Month<select value={month} onChange={(e) => setMonth(Number(e.target.value))}>{months.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}</select></label>
          <label>Year<input type="number" min="2020" max="2100" value={year} onChange={(e) => setYear(Number(e.target.value))} /></label>
        </div>
      </div>

      {isAdmin && <div className="panel admin-report-scope"><div className="panel-head"><div><h3><FaShieldAlt /> Admin Privacy Scope</h3><p className="muted">Administrator reports contain aggregate totals and category summaries across users only. Individual user history is not exposed.</p></div></div></div>}

      <div className="panel">
        <div className="panel-head"><div><h3>Download Report</h3><p className="muted">Export the selected {period} report as a professional PDF or Excel file.</p></div></div>
        {canExport ? (
          <div className="quick-actions">
            <button className="primary" onClick={() => downloadReport("pdf")} disabled={!!downloading}><FaFilePdf /> {downloading === "pdf" ? "Preparing PDF..." : "Download PDF"}</button>
            <button className="secondary" onClick={() => downloadReport("excel")} disabled={!!downloading}><FaFileExcel /> {downloading === "excel" ? "Preparing Excel..." : "Download Excel"}</button>
          </div>
        ) : <div className="premium-note"><strong>Premium feature.</strong> PDF and Excel downloads are available to Premium and Admin accounts.</div>}
      </div>
    </Layout>
  );
}
