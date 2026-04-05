import apiClient from "./apiClient";
import { apiCache } from "../lib/cache";

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
  const cacheKey = 'policies';
  const cached = apiCache.get<PolicyResponse[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const res = await apiClient.get("/policies");
  const data = res.data.data;
  apiCache.set(cacheKey, data, 10 * 60 * 1000); // Cache for 10 minutes
  return data;
};

export const createPolicy = async (data: CreatePolicyRequest): Promise<PolicyResponse> => {
  const res = await apiClient.post("/policies", data);
  // Invalidate cache when policies are modified
  apiCache.clear('policies');
  return res.data.data;
};

export const updatePolicy = async (
  id: number,
  data: Partial<CreatePolicyRequest & { enabled: boolean }>
): Promise<PolicyResponse> => {
  const res = await apiClient.put(`/policies/${id}`, data);
  // Invalidate cache when policies are modified
  apiCache.clear('policies');
  return res.data.data;
};
