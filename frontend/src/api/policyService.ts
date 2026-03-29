import apiClient from "./apiClient";

export interface PolicyResponse {
  id: number;
  name: string;
  category: string;
  maxAmount: number;
  dailyLimit: number;
  enabled: boolean;
  createdAt: string;
}

export interface CreatePolicyRequest {
  name: string;
  category: string;
  maxAmount: number;
  dailyLimit: number;
}

export const getPolicies = async (): Promise<PolicyResponse[]> => {
  const res = await apiClient.get("/policies");
  return res.data.data;
};

export const createPolicy = async (data: CreatePolicyRequest): Promise<PolicyResponse> => {
  const res = await apiClient.post("/policies", data);
  return res.data.data;
};

export const updatePolicy = async (
  id: number,
  data: Partial<CreatePolicyRequest & { enabled: boolean }>
): Promise<PolicyResponse> => {
  const res = await apiClient.put(`/policies/${id}`, data);
  return res.data.data;
};
