import api from "../api";

/*
 * Get all budgets.
 */
export const getBudgets = () =>
  api.get("/budget/");

/*
 * Create monthly budget.
 */
export const addBudget = (data) =>
  api.post("/budget/", data);

/*
 * Update monthly budget.
 */
export const updateBudget = (
  id,
  data
) =>
  api.put(
    `/budget/${id}`,
    data
  );

/*
 * Delete budget.
 */
export const deleteBudget = (id) =>
  api.delete(
    `/budget/${id}`
  );

/*
 * Get progress for a month.
 */
export const getBudgetProgress = (
  monthYear
) =>
  api.get(
    "/budget/progress",
    {
      params: {
        month_year: monthYear,
      },
    }
  );

/*
 * Create/update annual budget.
 */
export const addAnnualBudget = (
  data
) =>
  api.post(
    "/budget/annual",
    data
  );