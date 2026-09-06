import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Dashboard from "../pages/Dashboard";

jest.mock("../api", () => ({
  get: jest.fn(() => Promise.resolve({
    data: {
      total_income: 5000,
      total_expense: 1000,
      balance: 4000,
      savings_rate: 80,
      available_balance: 3500,
      expense_summary: [{ category: "Food", total: 1000 }],
      recent_transactions: [],
    },
  })),
}));

jest.mock("../components/Layout", () => ({ children }) => <main>{children}</main>);

test("Dashboard renders with mock API data", async () => {
  render(<MemoryRouter><Dashboard /></MemoryRouter>);
  await waitFor(() => expect(screen.getByText("Financial Overview")).toBeInTheDocument());
  expect(screen.getByText("₹5,000")).toBeInTheDocument();
  expect(screen.getByText("Food")).toBeInTheDocument();
});
