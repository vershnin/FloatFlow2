import { describe, expect, it, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import ReportsPage from "@/pages/ReportsPage";

const getSummaryReport = vi.fn();
const getBranchReport = vi.fn();

vi.mock("@/api/reportService", () => ({
  getSummaryReport: (...args: unknown[]) => getSummaryReport(...args),
  getBranchReport: (...args: unknown[]) => getBranchReport(...args),
}));

vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({
    user: { role: "FINANCE_OFFICER", branchId: 1 },
  }),
}));

describe("ReportsPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads summary and selected branch detail", async () => {
    getSummaryReport.mockResolvedValueOnce([
      {
        branchId: 1,
        branchName: "Nairobi Branch",
        totalFloatAllocated: 200000,
        totalExpensesApproved: 80000,
        remainingFloat: 120000,
        pendingExpensesCount: 2,
        approvedExpensesCount: 5,
        rejectedExpensesCount: 1,
      },
      {
        branchId: 2,
        branchName: "Mombasa Branch",
        totalFloatAllocated: 150000,
        totalExpensesApproved: 40000,
        remainingFloat: 110000,
        pendingExpensesCount: 1,
        approvedExpensesCount: 3,
        rejectedExpensesCount: 0,
      },
    ]);
    getBranchReport.mockResolvedValueOnce({
      branchId: 1,
      branchName: "Nairobi Branch",
      totalFloatAllocated: 200000,
      totalExpensesApproved: 80000,
      remainingFloat: 120000,
      pendingExpensesCount: 2,
      approvedExpensesCount: 5,
      rejectedExpensesCount: 1,
    });

    render(<ReportsPage />);

    expect(await screen.findByText("Summary By Branch")).toBeInTheDocument();
    expect(await screen.findByText("Selected Branch Detail")).toBeInTheDocument();

    await waitFor(() => {
      expect(getSummaryReport).toHaveBeenCalled();
      expect(getBranchReport).toHaveBeenCalledWith(1);
    });

    expect(screen.getAllByText("Nairobi Branch").length).toBeGreaterThan(0);
    expect(screen.getAllByText(/KES\s*120,000/).length).toBeGreaterThan(0);
  });
});