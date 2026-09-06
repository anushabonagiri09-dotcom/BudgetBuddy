import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import ProtectedRoute from "../routes/ProtectedRoute";

const mockUseAuth = jest.fn();
jest.mock("../context/AuthContext", () => ({
  useAuth: () => mockUseAuth(),
}));

describe("ProtectedRoute", () => {
  test("redirects to login without a token", () => {
    mockUseAuth.mockReturnValue({ token: null, loading: false });
    render(
      <MemoryRouter initialEntries={["/private"]}>
        <ProtectedRoute><div>Private content</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.queryByText("Private content")).not.toBeInTheDocument();
  });

  test("renders protected content with a token", () => {
    mockUseAuth.mockReturnValue({ token: "token", loading: false });
    render(
      <MemoryRouter>
        <ProtectedRoute><div>Private content</div></ProtectedRoute>
      </MemoryRouter>
    );
    expect(screen.getByText("Private content")).toBeInTheDocument();
  });
});
