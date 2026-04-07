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
  status: "DRAFT" | "PENDING" | "APPROVED" | "REJECTED" | "WITHDRAWN";
  createdAt: string;
  policyViolations?: PolicyViolation[];
  approvalChain?: Approval[];
}

export interface PolicyViolation {
  type: string;
  message: string;
  severity: "WARNING" | "ERROR";
}

export interface Approval {
  id: number;
  approvedByName: string;
  approvedByEmail: string;
  status: "APPROVED" | "REJECTED";
  comment?: string;
  approvedAt: string;
}

export interface SubmitExpenseRequest {
  floatId: number;
  amount: number;
  category: string;
  description: string;
  receiptUrl?: string;
  status?: "DRAFT" | "PENDING";
}

export interface ExpensePageResponse {
  content: ExpenseResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const getExpenses = async (params?: {
  page?: number;
  size?: number;
  status?: string;
  branchId?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ExpenseResponse[]> => {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.branchId !== undefined) queryParams.append('branchId', params.branchId.toString());
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const queryString = queryParams.toString();
  const url = queryString ? `/expenses?${queryString}` : '/expenses';
  const res = await apiClient.get(url);
  const data = res.data.data;

  if (Array.isArray(data)) {
    return data;
  }

  return data?.content ?? [];
};

export const getMyExpenses = async (params?: {
  page?: number;
  size?: number;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ExpenseResponse[]> => {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.status) queryParams.append('status', params.status);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const queryString = queryParams.toString();
  const url = queryString ? `/expenses/my?${queryString}` : '/expenses/my';
  const res = await apiClient.get(url);
  const data = res.data.data;

  if (Array.isArray(data)) {
    return data;
  }

  return data?.content ?? [];
};

export const getPendingExpenses = async (params?: {
  page?: number;
  size?: number;
  branchId?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ExpenseResponse[]> => {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.branchId !== undefined) queryParams.append('branchId', params.branchId.toString());
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const queryString = queryParams.toString();
  const url = queryString ? `/expenses/pending?${queryString}` : '/expenses/pending';
  const res = await apiClient.get(url);
  const data = res.data.data;

  if (Array.isArray(data)) {
    return data;
  }

  return data?.content ?? [];
};

export const getBranchExpenses = async (params?: {
  page?: number;
  size?: number;
  dateFrom?: string;
  dateTo?: string;
}): Promise<ExpenseResponse[]> => {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const queryString = queryParams.toString();
  const url = queryString ? `/expenses/branch?${queryString}` : '/expenses/branch';
  const res = await apiClient.get(url);
  const data = res.data.data;

  if (Array.isArray(data)) {
    return data;
  }

  return data?.content ?? [];
};

export const submitExpense = async (
  data: SubmitExpenseRequest
): Promise<ExpenseResponse> => {
  const res = await apiClient.post("/expenses", data);
  return res.data.data;
};

export const submitDraftExpense = async (expenseId: number): Promise<ExpenseResponse> => {
  const res = await apiClient.post(`/expenses/${expenseId}/submit`);
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

export const getExpenseById = async (expenseId: number): Promise<ExpenseResponse> => {
  const res = await apiClient.get(`/expenses/${expenseId}`);
  return res.data.data;
};

export const uploadReceipt = async (expenseId: number, file: File): Promise<{ receiptUrl: string }> => {
  const formData = new FormData();
  formData.append('receipt', file);

  const res = await apiClient.put(`/expenses/${expenseId}/receipt`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return res.data.data;
};