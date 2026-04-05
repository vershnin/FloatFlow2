import apiClient from "./apiClient";

export interface ReportSummary {
  totalExpenses: number;
  totalFloatAllocated: number;
  totalFloatUsed: number;
  totalFloatRemaining: number;
  approvalRate: number;
  averageProcessingTime: number;
  monthlyExpenseTrend: MonthlyExpenseData[];
  branchComparison: BranchComparisonData[];
  floatUsage: FloatUsageData[];
  categoryBreakdown: CategoryBreakdownData[];
}

export interface MonthlyExpenseData {
  month: string;
  submitted: number;
  approved: number;
  rejected: number;
}

export interface BranchComparisonData {
  branch: string;
  expenses: number;
  float: number;
}

export interface FloatUsageData {
  name: string;
  value: number;
}

export interface CategoryBreakdownData {
  name: string;
  value: number;
}

export interface BranchReport {
  branchId: number;
  branchName: string;
  totalExpenses: number;
  totalFloatAllocated: number;
  totalFloatUsed: number;
  totalFloatRemaining: number;
  approvalRate: number;
  averageProcessingTime: number;
  monthlyData: MonthlyExpenseData[];
  categoryBreakdown: CategoryBreakdownData[];
}

export const getSummaryReport = async (period?: string): Promise<ReportSummary> => {
  const params = period ? `?period=${period}` : '';
  const res = await apiClient.get(`/reports/summary${params}`);
  return res.data.data;
};

export const getBranchReport = async (branchId: number, period?: string): Promise<BranchReport> => {
  const params = period ? `?period=${period}` : '';
  const res = await apiClient.get(`/reports/branch/${branchId}${params}`);
  return res.data.data;
};
