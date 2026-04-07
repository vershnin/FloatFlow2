import apiClient from "./apiClient";

export interface FloatTransaction {
  id: number;
  type: "INITIAL_ALLOCATION" | "TOPUP" | "EXPENSE_DEDUCTION" | "CLOSED";
  amount: number;
  reference?: string;
  createdAt: string;
}

export interface FloatResponse {
  id: number;
  branchId: number;
  branchName: string;
  initialAmount: number;
  currentBalance: number;
  balancePercentage: number;
  status: "ACTIVE" | "CLOSED" | "EXHAUSTED";
  createdByName: string;
  createdAt: string;
}

export interface CreateFloatRequest {
  branchId: number;
  initialAmount: number;
}

export interface TopUpFloatRequest {
  amount: number;
  reference?: string;
}

export const getFloats = async (params?: {
  page?: number;
  size?: number;
  branchId?: number;
  status?: string;
}): Promise<FloatResponse[]> => {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append("page", params.page.toString());
  if (params?.size !== undefined) queryParams.append("size", params.size.toString());
  if (params?.branchId !== undefined) queryParams.append("branchId", params.branchId.toString());
  if (params?.status) queryParams.append("status", params.status);

  const queryString = queryParams.toString();
  const url = queryString ? `/floats?${queryString}` : "/floats";
  const res = await apiClient.get(url);
  const data = res.data.data;

  if (Array.isArray(data)) return data;
  return data?.content ?? [];
};

export const getMyBranchActiveFloat = async (): Promise<FloatResponse | null> => {
  const res = await apiClient.get("/floats/active/my-branch");
  return res.data?.data ?? null;
};

export const createFloat = async (data: CreateFloatRequest): Promise<FloatResponse> => {
  const res = await apiClient.post("/floats", data);
  return res.data.data;
};

export const topUpFloat = async (floatId: number, data: TopUpFloatRequest): Promise<FloatResponse> => {
  const res = await apiClient.put(`/floats/${floatId}/topup`, data);
  return res.data.data;
};

export const closeFloat = async (floatId: number): Promise<FloatResponse> => {
  const res = await apiClient.put(`/floats/${floatId}/close`);
  return res.data.data;
};

export const getFloatTransactions = async (floatId: number): Promise<FloatTransaction[]> => {
  const res = await apiClient.get(`/floats/${floatId}/transactions`);
  return res.data.data ?? [];
};