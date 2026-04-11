import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";

let mockAuthState = {
  isAuthenticated: true,
  user: { role: "FINANCE_OFFICER" },
};

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => mockAuthState,
}));

describe("ProtectedRoute", () => {
  it("redirects unauthenticated users to landing", () => {
    mockAuthState = {
      isAuthenticated: false,
      user: { role: "EMPLOYEE" },
    };

    render(
      <MemoryRouter initialEntries={["/expenses"]}>
        <Routes>
          <Route
            path="/expenses"
            element={
              <ProtectedRoute>
                <div>expenses-page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/landing" element={<div>landing-page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("expenses-page")).not.toBeInTheDocument();
    expect(screen.getByText("landing-page")).toBeInTheDocument();
  });

  it("redirects unauthorized role to home", () => {
    mockAuthState = {
      isAuthenticated: true,
      user: { role: "FINANCE_OFFICER" },
    };

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"] as any}>
                <div>admin-page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>home-page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByText("admin-page")).not.toBeInTheDocument();
    expect(screen.getByText("home-page")).toBeInTheDocument();
  });

  it("renders content for authorized role", () => {
    mockAuthState = {
      isAuthenticated: true,
      user: { role: "ADMIN" },
    };

    render(
      <MemoryRouter initialEntries={["/admin/users"]}>
        <Routes>
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute allowedRoles={["ADMIN"] as any}>
                <div>admin-page</div>
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<div>home-page</div>} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText("admin-page")).toBeInTheDocument();
  });
});
