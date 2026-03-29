import apiClient from "./apiClient";

export interface ExpenseResponse {
  id: number;
  floatId: number;
  submittedByName: string;
  submittedByEmail: string;
  branchId: number;
  branchName: string;
  amount: number;
  category: string;
  description: string;
  receiptUrl?: string;
  status: "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
}

export interface SubmitExpenseRequest {
  floatId: number;
  amount: number;
  category: string;
  description: string;
  receiptUrl?: string;
}

export const getExpenses = async (): Promise<ExpenseResponse[]> => {
  const res = await apiClient.get("/expenses");
  return res.data.data;
};

export const getMyExpenses = async (): Promise<ExpenseResponse[]> => {
  const res = await apiClient.get("/expenses/my");
  return res.data.data;
};

export const getPendingExpenses = async (): Promise<ExpenseResponse[]> => {
  const res = await apiClient.get("/expenses/pending");
  return res.data.data;
};

export const submitExpense = async (
  data: SubmitExpenseRequest
): Promise<ExpenseResponse> => {
  const res = await apiClient.post("/expenses", data);
  return res.data.data;
};

export const approveExpense = async (
  expenseId: number,
  comment?: string
): Promise<ExpenseResponse> => {
  const res = await apiClient.put(`/expenses/${expenseId}/approve`, { comment });
  return res.data.data;
};

export const rejectExpense = async (
  expenseId: number,
  comment?: string
): Promise<ExpenseResponse> => {
  const res = await apiClient.put(`/expenses/${expenseId}/reject`, { comment });
  return res.data.data;
};