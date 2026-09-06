import React, { useEffect, useMemo, useState } from "react";
import Layout from "../components/Layout";

const API_URL = "http://127.0.0.1:8000";

const categories = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Education",
  "Travel",
  "Other",
];

const months = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currency = (value) =>
  `₹${Number(value || 0).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getBudgetAmount = (item) =>
  Number(
    item?.limit_amount ??
      item?.budget ??
      item?.amount ??
      item?.limit ??
      item?.monthly_budget ??
      0
  );

const getSpentAmount = (item) =>
  Number(
    item?.spent ??
      item?.spending ??
      item?.expense ??
      item?.total_spent ??
      0
  );

const getItemMonth = (item) => {
  const direct = Number(item?.month ?? item?.month_number ?? item?.monthNumber);
  if (Number.isFinite(direct) && direct >= 1 && direct <= 12) return direct;
  const match = String(item?.month_year ?? "").match(/^(\d{4})-(\d{2})$/);
  return match ? Number(match[2]) : 0;
};

const getItemYear = (item) => {
  const direct = Number(item?.year ?? item?.budget_year);
  if (Number.isFinite(direct) && direct >= 2000 && direct <= 2100) return direct;
  const match = String(item?.month_year ?? "").match(/^(\d{4})-(\d{2})$/);
  return match ? Number(match[1]) : 0;
};

const getItemCategory = (item) =>
  item?.category ?? item?.category_name ?? "Budget";

const styles = `
* {
  box-sizing: border-box;
}

.budget-page {
  min-height: 100vh;
  background: #f5f7fb;
  padding: 32px 20px 60px;
  color: #172033;
  font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
}

.budget-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 24px;
  margin-bottom: 28px;
}

.budget-eyebrow,
.section-label {
  display: inline-block;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 1.4px;
  color: #64748b;
  margin-bottom: 8px;
}

.budget-header h1 {
  margin: 0;
  font-size: 38px;
  line-height: 1.15;
  font-weight: 800;
  color: #111827;
}

.budget-header p {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 15px;
  line-height: 1.6;
}

.budget-header-icon {
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 20px;
  background: #eaf2ff;
  font-size: 34px;
}

.budget-tabs {
  display: flex;
  gap: 8px;
  padding: 6px;
  background: #e8edf5;
  border-radius: 14px;
  margin-bottom: 24px;
}

.budget-tab {
  flex: 1;
  border: none;
  border-radius: 10px;
  padding: 13px 18px;
  background: transparent;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.budget-tab span {
  margin-right: 7px;
}

.budget-tab:hover {
  color: #1e293b;
}

.budget-tab.active {
  background: #ffffff;
  color: #2563eb;
  box-shadow: 0 2px 8px rgba(15, 23, 42, 0.08);
}

.budget-alert {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  margin-bottom: 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
}

.budget-alert.error {
  background: #fff1f2;
  color: #be123c;
  border: 1px solid #fecdd3;
}

.budget-alert.success {
  background: #ecfdf5;
  color: #047857;
  border: 1px solid #a7f3d0;
}

.budget-alert div {
  flex: 1;
}

.budget-alert button {
  border: none;
  background: transparent;
  color: inherit;
  font-size: 22px;
  cursor: pointer;
}

.budget-card {
  background: #ffffff;
  border: 1px solid #e5eaf1;
  border-radius: 18px;
  padding: 26px;
  margin-bottom: 22px;
  box-shadow: 0 5px 20px rgba(15, 23, 42, 0.04);
}

.card-title-row,
.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
}

.card-title-row h2,
.section-header h2 {
  margin: 0;
  font-size: 21px;
  color: #111827;
}

.card-title-row p,
.section-header p {
  margin: 7px 0 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.5;
}

.card-icon {
  width: 48px;
  height: 48px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 800;
  flex-shrink: 0;
}

.card-icon.blue {
  background: #eaf2ff;
  color: #2563eb;
}

.card-icon.purple {
  background: #f3e8ff;
  color: #9333ea;
}

.budget-form {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 18px;
  margin-top: 26px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-group label {
  font-size: 13px;
  font-weight: 700;
  color: #374151;
}

.form-group input,
.form-group select,
.month-filter {
  width: 100%;
  height: 44px;
  padding: 0 12px;
  border: 1px solid #d8dee8;
  border-radius: 9px;
  background: #ffffff;
  color: #1f2937;
  font-size: 14px;
  outline: none;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-group input:focus,
.form-group select:focus,
.month-filter:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.money-input {
  display: flex;
  align-items: center;
  height: 44px;
  border: 1px solid #d8dee8;
  border-radius: 9px;
  overflow: hidden;
  background: #ffffff;
}

.money-input:focus-within {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.money-input span {
  padding-left: 12px;
  font-weight: 700;
  color: #64748b;
}

.money-input input {
  border: none;
  box-shadow: none !important;
  height: 42px;
  flex: 1;
}

.form-actions {
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.primary-button,
.secondary-button,
.delete-button {
  border: none;
  border-radius: 9px;
  padding: 11px 17px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  transition: 0.2s ease;
}

.primary-button {
  background: #2563eb;
  color: white;
}

.primary-button:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.primary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.primary-button.small {
  padding: 9px 15px;
}

.secondary-button {
  background: #f1f5f9;
  color: #334155;
  border: 1px solid #e2e8f0;
}

.secondary-button:hover {
  background: #e2e8f0;
}

.secondary-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.progress-card {
  overflow: hidden;
}

.section-header {
  align-items: center;
  margin-bottom: 24px;
}

.month-filter {
  max-width: 170px;
}

.empty-state {
  text-align: center;
  padding: 50px 20px;
  border: 1px dashed #d7dee9;
  border-radius: 14px;
  background: #fafbfc;
}

.empty-icon {
  font-size: 40px;
  margin-bottom: 10px;
}

.empty-state h3 {
  margin: 0 0 7px;
  font-size: 18px;
}

.empty-state p {
  margin: 0 auto 18px;
  max-width: 450px;
  color: #64748b;
  font-size: 14px;
}

.progress-summary {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.summary-box {
  padding: 17px;
  border: 1px solid #e7ebf1;
  border-radius: 12px;
  background: #fafbfc;
}

.summary-box span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 7px;
}

.summary-box strong {
  font-size: 19px;
  color: #111827;
}

.success-text {
  color: #059669 !important;
}

.danger-text {
  color: #dc2626 !important;
}

.overall-progress {
  margin: 26px 0;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 9px;
  color: #475569;
  font-size: 13px;
}

.progress-track {
  width: 100%;
  height: 9px;
  background: #e8edf3;
  border-radius: 999px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #2563eb, #60a5fa);
  border-radius: inherit;
  transition: width 0.4s ease;
}

.progress-fill.warning {
  background: #f59e0b;
}

.progress-fill.danger {
  background: #ef4444;
}

.progress-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
}

.progress-item {
  padding: 18px;
  border: 1px solid #e7ebf1;
  border-radius: 13px;
  background: #ffffff;
}

.progress-item-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.category-name {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 14px;
}

.category-dot {
  width: 8px;
  height: 8px;
  display: inline-block;
  border-radius: 50%;
  background: #3b82f6;
}

.spent-line {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  margin-top: 10px;
  color: #64748b;
  font-size: 12px;
}

.spent-line strong {
  color: #334155;
}

.remaining-line {
  margin-top: 8px;
  font-size: 12px;
  color: #059669;
  font-weight: 700;
}

.table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.budget-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
  min-width: 760px;
}

.budget-table th {
  text-align: left;
  padding: 13px 12px;
  background: #f8fafc;
  color: #64748b;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.7px;
}

.budget-table td {
  padding: 15px 12px;
  border-top: 1px solid #edf0f4;
  color: #475569;
  font-size: 13px;
}

.table-category {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #1f2937;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
  border-radius: 999px;
  font-size: 11px;
  font-weight: 800;
}

.status-pill.success {
  background: #dcfce7;
  color: #15803d;
}

.status-pill.warning {
  background: #fef3c7;
  color: #b45309;
}

.status-pill.danger {
  background: #fee2e2;
  color: #b91c1c;
}

.delete-button {
  padding: 7px 10px;
  background: #fff1f2;
  color: #be123c;
}

.delete-button:hover {
  background: #ffe4e6;
}

.table-empty {
  padding: 45px;
  text-align: center;
  color: #64748b;
}

.table-empty span {
  display: block;
  font-size: 32px;
  margin-bottom: 8px;
}

.table-empty p {
  margin: 0;
}









@media (max-width: 900px) {
  .budget-form {
    grid-template-columns: repeat(2, 1fr);
  }

  .progress-summary {
    grid-template-columns: repeat(2, 1fr);
  }

  .progress-grid {
    grid-template-columns: 1fr;
  }

  
}

@media (max-width: 600px) {
  .budget-page {
    padding: 20px 12px 40px;
  }

  .budget-header {
    align-items: flex-start;
  }

  .budget-header h1 {
    font-size: 30px;
  }

  .budget-header-icon {
    width: 54px;
    height: 54px;
    font-size: 25px;
  }

  .budget-card {
    padding: 18px;
    border-radius: 14px;
  }

  .budget-form,
  .progress-summary,

  .section-header,
  .card-title-row {
    align-items: flex-start;
  }

  .month-filter {
    max-width: 140px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions button {
    width: 100%;
  }
}
`;

export default function Budget() {
  const now = new Date();

  const [category, setCategory] = useState("Food");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [monthlyBudget, setMonthlyBudget] = useState("");

  const [selectedProgressMonth, setSelectedProgressMonth] =
    useState(now.getMonth() + 1);

  const [budgets, setBudgets] = useState([]);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const token =
    localStorage.getItem("access_token") ||
    localStorage.getItem("token");

  const authHeaders = {
    "Content-Type": "application/json",
    ...(token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : {}),
  };

  const monthName = (monthNumber) =>
    months.find(
      (item) => item.value === Number(monthNumber)
    )?.label || "";

  useEffect(() => {
    const oldStyle = document.querySelector(
      'style[data-budget-styles="true"]'
    );

    if (oldStyle) {
      oldStyle.remove();
    }

    const style = document.createElement("style");

    style.setAttribute(
      "data-budget-styles",
      "true"
    );

    style.innerHTML = styles;

    document.head.appendChild(style);

    return () => {
      const existing = document.querySelector(
        'style[data-budget-styles="true"]'
      );

      if (existing) {
        existing.remove();
      }
    };
  }, []);

  /*
   * LOAD MONTHLY BUDGETS
   */
  const loadBudgets = async (
    targetMonth = selectedProgressMonth,
    targetYear = year
  ) => {
    setLoading(true);
    setError("");

    try {
      const numericMonth = Number(targetMonth);
      const numericYear = Number(targetYear);

      if (
        !numericMonth ||
        numericMonth < 1 ||
        numericMonth > 12 ||
        !numericYear
      ) {
        throw new Error("Invalid month or year.");
      }

      const monthYear = `${numericYear}-${String(numericMonth).padStart(2, "0")}`;
      const params = new URLSearchParams({ month_year: monthYear });

      // Use the progress endpoint so the response contains the live
      // amount spent, remaining amount and percentage for each budget.
      const url = `${API_URL}/budget/progress?${params.toString()}`;

      console.log("Loading budgets:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: authHeaders,
      });

      const responseText = await response.text();

      let data = null;

      try {
        data = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        data = responseText;
      }

      if (!response.ok) {
        let message =
          `Unable to load budgets (${response.status})`;

        if (data?.detail) {
          if (Array.isArray(data.detail)) {
            message = data.detail
              .map((item) => {
                const location = Array.isArray(item.loc)
                  ? item.loc.join(".")
                  : "";

                return location
                  ? `${location}: ${item.msg}`
                  : item.msg;
              })
              .join(", ");
          } else {
            message = data.detail;
          }
        } else if (typeof data === "string" && data) {
          message = data;
        }

        throw new Error(message);
      }

      console.log(
        "Monthly budget response:",
        data
      );

      let list = [];

      if (Array.isArray(data)) {
        list = data;
      } else if (Array.isArray(data?.budgets)) {
        list = data.budgets;
      } else if (Array.isArray(data?.items)) {
        list = data.items;
      } else if (
        data &&
        typeof data === "object" &&
        (
          data.id ||
          data.category ||
          data.category_name
        )
      ) {
        list = [data];
      }

      setBudgets(list);
    } catch (err) {
      console.error(
        "Budget loading error:",
        err
      );

      setBudgets([]);

      setError(
        err.message ||
          "Unable to load monthly budgets."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets(selectedProgressMonth, year);

    // Refresh whenever the Budget screen becomes active again and periodically
    // so spending progress reflects expenses added from another screen/tab.
    const refreshOnFocus = () => loadBudgets(selectedProgressMonth, year);
    window.addEventListener("focus", refreshOnFocus);
    const timer = window.setInterval(refreshOnFocus, 30000);
    return () => {
      window.removeEventListener("focus", refreshOnFocus);
      window.clearInterval(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProgressMonth, year]);

  /*
   * FIND EXISTING BUDGET
   */
  const existingBudget = useMemo(() => {
    return budgets.find((item) => {
      return (
        getItemMonth(item) === Number(month) &&
        getItemYear(item) === Number(year) &&
        String(getItemCategory(item))
          .toLowerCase() ===
          String(category).toLowerCase()
      );
    });
  }, [
    budgets,
    category,
    month,
    year,
  ]);

  /*
   * LOAD EXISTING AMOUNT INTO FORM
   */
  useEffect(() => {
    if (existingBudget) {
      setMonthlyBudget(
        String(
          getBudgetAmount(existingBudget)
        )
      );
    } else {
      setMonthlyBudget("");
    }
  }, [existingBudget]);

  /*
   * SAVE MONTHLY BUDGET
   *
   * IMPORTANT:
   * FastAPI expects month_year as STRING.
   */
  const saveMonthlyBudget = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    const amount = Number(monthlyBudget);
    const selectedMonth = Number(month);
    const selectedYear = Number(year);

    if (!amount || amount <= 0) {
      setError(
        "Please enter a valid budget amount."
      );
      return;
    }

    if (
      !selectedMonth ||
      selectedMonth < 1 ||
      selectedMonth > 12
    ) {
      setError(
        "Please select a valid month."
      );
      return;
    }

    if (
      !selectedYear ||
      selectedYear < 2020 ||
      selectedYear > 2100
    ) {
      setError(
        "Please enter a valid year."
      );
      return;
    }

    /*
     * FIX:
     *
     * month_year MUST BE A STRING.
     *
     * Before:
     * month_year: selectedYear
     *
     * Now:
     * month_year: String(selectedYear)
     */
    const payload = {
      category: String(category),
      month_year: `${selectedYear}-${String(selectedMonth).padStart(2, "0")}`,
      limit_amount: amount,
    };

    console.log(
      "Saving monthly budget:",
      payload
    );

    setSaving(true);

    try {
      let response;

      /*
       * UPDATE EXISTING BUDGET
       */
      if (existingBudget?.id) {
        response = await fetch(
          `${API_URL}/budget/monthly/${existingBudget.id}`,
          {
            method: "PUT",
            headers: authHeaders,
            body: JSON.stringify(payload),
          }
        );
      } else {
        /*
         * CREATE NEW BUDGET
         */
        response = await fetch(
          `${API_URL}/budget/monthly`,
          {
            method: "POST",
            headers: authHeaders,
            body: JSON.stringify(payload),
          }
        );
      }

      const responseText =
        await response.text();

      let responseData = null;

      try {
        responseData = responseText
          ? JSON.parse(responseText)
          : null;
      } catch {
        responseData = responseText;
      }

      console.log(
        "Backend response:",
        responseData
      );

      if (!response.ok) {
        let message =
          `Unable to save budget (${response.status})`;

        if (responseData?.detail) {
          if (
            Array.isArray(
              responseData.detail
            )
          ) {
            message =
              responseData.detail
                .map((item) => {
                  const location =
                    Array.isArray(item.loc)
                      ? item.loc.join(".")
                      : "";

                  return location
                    ? `${location}: ${item.msg}`
                    : item.msg;
                })
                .join(", ");
          } else {
            message =
              responseData.detail;
          }
        } else if (
          typeof responseData === "string" &&
          responseData
        ) {
          message = responseData;
        }

        throw new Error(message);
      }

      setSuccess(
        `${category} budget for ${monthName(
          selectedMonth
        )} ${selectedYear} saved successfully.`
      );

      /*
       * Synchronize progress month.
       */
      setSelectedProgressMonth(
        selectedMonth
      );

      /*
       * Reload backend data.
       */
      await loadBudgets(
        selectedMonth,
        selectedYear
      );
    } catch (err) {
      console.error(
        "Save budget error:",
        err
      );

      setError(
        err.message ||
          "Unable to save budget."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * DELETE MONTHLY BUDGET
   */
  const deleteBudget = async (id) => {
    if (!id) {
      setError(
        "This budget does not have a valid ID."
      );
      return;
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to delete this budget?"
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);

    try {
      const response = await fetch(
        `${API_URL}/budget/monthly/${id}`,
        {
          method: "DELETE",
          headers: authHeaders,
        }
      );

      const text =
        await response.text();

      let data = null;

      try {
        data = text
          ? JSON.parse(text)
          : null;
      } catch {
        data = text;
      }

      if (!response.ok) {
        let message =
          "Unable to delete budget.";

        if (data?.detail) {
          message = Array.isArray(data.detail)
            ? data.detail
                .map(
                  (item) =>
                    item.msg
                )
                .join(", ")
            : data.detail;
        } else if (
          typeof data === "string" &&
          data
        ) {
          message = data;
        }

        throw new Error(message);
      }

      setSuccess(
        "Budget deleted successfully."
      );

      await loadBudgets(
        selectedProgressMonth,
        year
      );
    } catch (err) {
      console.error(
        "Delete budget error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete budget."
      );
    } finally {
      setSaving(false);
    }
  };

  /*
   * FILTER PROGRESS BUDGETS
   */
  const progressBudgets = useMemo(() => {
    // /budget/progress is already scoped to the selected YYYY-MM period.
    // Keeping that response intact prevents a second client-side filter from
    // accidentally hiding valid budgets when the backend only returns
    // month_year.
    return budgets.filter((item) => Number(getBudgetAmount(item)) > 0);
  }, [budgets]);

  /*
   * TOTAL BUDGET
   */
  const totalBudget =
    progressBudgets.reduce(
      (sum, item) =>
        sum + getBudgetAmount(item),
      0
    );

  /*
   * TOTAL SPENT
   */
  const totalSpent =
    progressBudgets.reduce(
      (sum, item) =>
        sum + getSpentAmount(item),
      0
    );

  /*
   * OVERALL PROGRESS
   */
  const overallProgress =
    totalBudget > 0
      ? Math.min(
          (totalSpent / totalBudget) * 100,
          100
        )
      : 0;

  /*
   * PROGRESS MONTH CHANGE
   */
  const handleProgressMonthChange = (
    event
  ) => {
    const newMonth =
      Number(event.target.value);

    setSelectedProgressMonth(
      newMonth
    );

    setMonth(newMonth);
  };

  /*
   * FORM MONTH CHANGE
   */
  const handleFormMonthChange = (
    event
  ) => {
    const newMonth =
      Number(event.target.value);

    setMonth(newMonth);

    setSelectedProgressMonth(
      newMonth
    );
  };

  /*
   * YEAR CHANGE
   */
  const handleYearChange = (
    event
  ) => {
    const newYear =
      Number(event.target.value);

    setYear(newYear);
  };

  /*
   * CLEAR MONTHLY FORM
   */
  const clearMonthlyForm = () => {
    setMonthlyBudget("");
    setSuccess("");
    setError("");
  };

  return (
    <Layout title="Budgets">
      <div className="budget-page">
      <div className="budget-container">

        {/* ERROR */}
        {error && (
          <div className="budget-alert error">
            <span>⚠️</span>

            <div>{error}</div>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* SUCCESS */}
        {success && (
          <div className="budget-alert success">
            <span>✓</span>

            <div>{success}</div>

            <button
              type="button"
              onClick={() =>
                setSuccess("")
              }
            >
              ×
            </button>
          </div>
        )}

        {/* MONTHLY BUDGET */}
        <>
            {/* CREATE / UPDATE */}
            <section className="budget-card">
              <div className="card-title-row">
                <div>
                  <h2>
                    {existingBudget
                      ? "Update Monthly Budget"
                      : "Create Monthly Budget"}
                  </h2>

                  <p>
                    Set a spending limit
                    for a specific
                    category and month.
                  </p>
                </div>

                <div className="card-icon blue">
                  +
                </div>
              </div>

              <form
                className="budget-form"
                onSubmit={
                  saveMonthlyBudget
                }
              >
                {/* CATEGORY */}
                <div className="form-group">
                  <label>
                    Category
                  </label>

                  <select
                    value={category}
                    onChange={(event) =>
                      setCategory(
                        event.target.value
                      )
                    }
                  >
                    {categories.map(
                      (item) => (
                        <option
                          key={item}
                          value={item}
                        >
                          {item}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* MONTH */}
                <div className="form-group">
                  <label>
                    Month
                  </label>

                  <select
                    value={month}
                    onChange={
                      handleFormMonthChange
                    }
                  >
                    {months.map(
                      (item) => (
                        <option
                          key={
                            item.value
                          }
                          value={
                            item.value
                          }
                        >
                          {item.label}
                        </option>
                      )
                    )}
                  </select>
                </div>

                {/* YEAR */}
                <div className="form-group">
                  <label>
                    Year
                  </label>

                  <input
                    type="number"
                    min="2020"
                    max="2100"
                    value={year}
                    onChange={
                      handleYearChange
                    }
                  />
                </div>

                {/* AMOUNT */}
                <div className="form-group">
                  <label>
                    Monthly Budget
                  </label>

                  <div className="money-input">
                    <span>₹</span>

                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="5,000"
                      value={
                        monthlyBudget
                      }
                      onChange={(event) =>
                        setMonthlyBudget(
                          event.target.value
                        )
                      }
                    />
                  </div>
                </div>

                {/* ACTIONS */}
                <div className="form-actions">
                  <button
                    className="primary-button"
                    type="submit"
                    disabled={saving}
                  >
                    {saving
                      ? "Saving..."
                      : existingBudget
                      ? "Update Budget"
                      : "Create Budget"}
                  </button>

                  <button
                    className="secondary-button"
                    type="button"
                    onClick={
                      clearMonthlyForm
                    }
                  >
                    Clear
                  </button>
                </div>
              </form>
            </section>

            {/* PROGRESS */}
            <section className="budget-card progress-card">
              <div className="section-header">
                <div>
                  <span className="section-label">
                    SPENDING TRACKER
                  </span>

                  <h2>
                    Budget Progress
                  </h2>

                  <p>
                    Spending for{" "}
                    <strong>
                      {monthName(
                        selectedProgressMonth
                      )}{" "}
                      {year}
                    </strong>
                  </p>
                </div>

                <select
                  className="month-filter"
                  value={
                    selectedProgressMonth
                  }
                  onChange={
                    handleProgressMonthChange
                  }
                >
                  {months.map(
                    (item) => (
                      <option
                        key={
                          item.value
                        }
                        value={
                          item.value
                        }
                      >
                        {item.label}
                      </option>
                    )
                  )}
                </select>
              </div>

              {loading ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    ⏳
                  </div>

                  <h3>
                    Loading budgets...
                  </h3>

                  <p>
                    Getting your
                    budget information.
                  </p>
                </div>
              ) : progressBudgets.length ===
                0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    📊
                  </div>

                  <h3>
                    No budget yet
                  </h3>

                  <p>
                    No budget has been
                    created for{" "}
                    {monthName(
                      selectedProgressMonth
                    )}{" "}
                    {year}.
                  </p>

                  <button
                    type="button"
                    className="primary-button small"
                    onClick={() => {
                      setMonth(
                        selectedProgressMonth
                      );

                      window.scrollTo({
                        top: 0,
                        behavior:
                          "smooth",
                      });
                    }}
                  >
                    Create Budget
                  </button>
                </div>
              ) : (
                <>
                  {/* SUMMARY */}
                  <div className="progress-summary">
                    <div className="summary-box">
                      <span>
                        Total Budget
                      </span>

                      <strong>
                        {currency(
                          totalBudget
                        )}
                      </strong>
                    </div>

                    <div className="summary-box">
                      <span>
                        Total Spent
                      </span>

                      <strong>
                        {currency(
                          totalSpent
                        )}
                      </strong>
                    </div>

                    <div className="summary-box">
                      <span>
                        Remaining
                      </span>

                      <strong
                        className={
                          totalBudget -
                            totalSpent <
                          0
                            ? "danger-text"
                            : "success-text"
                        }
                      >
                        {currency(
                          Math.max(
                            totalBudget -
                              totalSpent,
                            0
                          )
                        )}
                      </strong>
                    </div>

                    <div className="summary-box">
                      <span>
                        Used
                      </span>

                      <strong>
                        {overallProgress.toFixed(
                          0
                        )}
                        %
                      </strong>
                    </div>
                  </div>

                  {/* OVERALL PROGRESS */}
                  <div className="overall-progress">
                    <div className="progress-label">
                      <span>
                        Overall spending
                      </span>

                      <strong>
                        {overallProgress.toFixed(
                          0
                        )}
                        %
                      </strong>
                    </div>

                    <div className="progress-track">
                      <div
                        className={`progress-fill ${
                          overallProgress >=
                          90
                            ? "danger"
                            : overallProgress >=
                              70
                            ? "warning"
                            : ""
                        }`}
                        style={{
                          width: `${overallProgress}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* CATEGORY PROGRESS */}
                  <div className="progress-grid">
                    {progressBudgets.map(
                      (item) => {
                        const budget =
                          getBudgetAmount(
                            item
                          );

                        const spent =
                          getSpentAmount(
                            item
                          );

                        const percentage =
                          budget > 0
                            ? Math.min(
                                (spent /
                                  budget) *
                                  100,
                                100
                              )
                            : 0;

                        const remaining =
                          Math.max(
                            budget -
                              spent,
                            0
                          );

                        const itemCategory =
                          getItemCategory(
                            item
                          );

                        const itemMonth =
                          getItemMonth(
                            item
                          );

                        const itemYear =
                          getItemYear(
                            item
                          );

                        return (
                          <div
                            className="progress-item"
                            key={
                              item.id ||
                              `${itemCategory}-${itemMonth}-${itemYear}`
                            }
                          >
                            <div className="progress-item-top">
                              <div className="category-name">
                                <span className="category-dot" />

                                {
                                  itemCategory
                                }
                              </div>

                              <strong>
                                {percentage.toFixed(
                                  0
                                )}
                                %
                              </strong>
                            </div>

                            <div className="progress-track">
                              <div
                                className={`progress-fill ${
                                  percentage >=
                                  90
                                    ? "danger"
                                    : percentage >=
                                      70
                                    ? "warning"
                                    : ""
                                }`}
                                style={{
                                  width: `${percentage}%`,
                                }}
                              />
                            </div>

                            <div className="spent-line">
                              <span>
                                Spent{" "}
                                <strong>
                                  {currency(
                                    spent
                                  )}
                                </strong>
                              </span>

                              <span>
                                Limit{" "}
                                <strong>
                                  {currency(
                                    budget
                                  )}
                                </strong>
                              </span>
                            </div>

                            <div className="remaining-line">
                              {remaining >
                              0
                                ? `${currency(
                                    remaining
                                  )} remaining`
                                : "Budget limit reached"}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </>
              )}
            </section>

            {/* BUDGET TABLE */}
            <section className="budget-card">
              <div className="section-header">
                <div>
                  <span className="section-label">
                    OVERVIEW
                  </span>

                  <h2>
                    Budget Allocations
                  </h2>

                  <p>
                    Budgets for{" "}
                    <strong>
                      {monthName(
                        selectedProgressMonth
                      )}{" "}
                      {year}
                    </strong>
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={() =>
                    loadBudgets(
                      selectedProgressMonth,
                      year
                    )
                  }
                  disabled={loading}
                >
                  {loading
                    ? "Refreshing..."
                    : "↻ Refresh"}
                </button>
              </div>

              {budgets.length === 0 ? (
                <div className="table-empty">
                  <span>📋</span>

                  <p>
                    No budgets created
                    for this month.
                  </p>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="budget-table">
                    <thead>
                      <tr>
                        <th>
                          Category
                        </th>

                        <th>
                          Month
                        </th>

                        <th>
                          Year
                        </th>

                        <th>
                          Budget
                        </th>

                        <th>
                          Spent
                        </th>

                        <th>
                          Status
                        </th>

                        <th>
                          Action
                        </th>
                      </tr>
                    </thead>

                    <tbody>
                      {budgets.map(
                        (item) => {
                          const budget =
                            getBudgetAmount(
                              item
                            );

                          const spent =
                            getSpentAmount(
                              item
                            );

                          const percentage =
                            budget > 0
                              ? (spent /
                                  budget) *
                                100
                              : 0;

                          const itemMonth =
                            getItemMonth(
                              item
                            );

                          const itemYear =
                            getItemYear(
                              item
                            );

                          const itemCategory =
                            getItemCategory(
                              item
                            );

                          return (
                            <tr
                              key={
                                item.id ||
                                `${itemCategory}-${itemMonth}-${itemYear}`
                              }
                            >
                              <td>
                                <div className="table-category">
                                  <span className="category-dot" />

                                  <strong>
                                    {
                                      itemCategory
                                    }
                                  </strong>
                                </div>
                              </td>

                              <td>
                                {monthName(
                                  itemMonth
                                )}
                              </td>

                              <td>
                                {itemYear}
                              </td>

                              <td>
                                <strong>
                                  {currency(
                                    budget
                                  )}
                                </strong>
                              </td>

                              <td>
                                {currency(
                                  spent
                                )}
                              </td>

                              <td>
                                <span
                                  className={`status-pill ${
                                    percentage >=
                                    90
                                      ? "danger"
                                      : percentage >=
                                        70
                                      ? "warning"
                                      : "success"
                                  }`}
                                >
                                  {percentage >=
                                  90
                                    ? "Near limit"
                                    : percentage >=
                                      70
                                    ? "Watch"
                                    : "On track"}
                                </span>
                              </td>

                              <td>
                                <button
                                  type="button"
                                  className="delete-button"
                                  onClick={() =>
                                    deleteBudget(
                                      item.id
                                    )
                                  }
                                >
                                  Delete
                                </button>
                              </td>
                            </tr>
                          );
                        }
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
        </>

      </div>
      </div>
    </Layout>
  );
}