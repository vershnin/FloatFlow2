import apiClient from "./apiClient";

export interface FloatResponse {
  id: number;
  branchId: number;
  branchName: string;
  initialAmount: number;
  currentBalance: number;
  status: "ACTIVE" | "CLOSED" | "EXHAUSTED";
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

export const getFloats = async (): Promise<FloatResponse[]> => {
  const res = await apiClient.get("/floats");
  return res.data.data;
};

export const createFloat = async (data: CreateFloatRequest): Promise<FloatResponse> => {
  const res = await apiClient.post("/floats", data);
  return res.data.data;
};

export const topUpFloat = async (floatId: number, data: TopUpFloatRequest): Promise<FloatResponse> => {
  const res = await apiClient.put(`/floats/${floatId}/topup`, data);
  return res.data.data;
};
