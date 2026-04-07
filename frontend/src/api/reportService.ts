import apiClient from "./apiClient";

export interface BranchReport {
  branchId: number;
  branchName: string;
  totalFloatAllocated: number;
  totalExpensesApproved: number;
  remainingFloat: number;
  pendingExpensesCount: number;
  approvedExpensesCount: number;
  rejectedExpensesCount: number;
}

export const getSummaryReport = async (): Promise<BranchReport[]> => {
  const res = await apiClient.get("/reports/summary");
  return res.data.data;
};

export const getBranchReport = async (branchId: number): Promise<BranchReport> => {
  const res = await apiClient.get(`/reports/branch/${branchId}`);
  return res.data.data;
};
