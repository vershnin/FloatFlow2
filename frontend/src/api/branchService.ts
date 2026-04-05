import apiClient from "./apiClient";
import { apiCache } from "../lib/cache";

export interface Branch {
  id: number;
  name: string;
  location: string;
  managerName?: string;
  managerEmail?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CreateBranchRequest {
  name: string;
  location: string;
  managerId?: number;
}

export interface UpdateBranchRequest {
  name?: string;
  location?: string;
  managerId?: number;
  isActive?: boolean;
}

export const getBranches = async (): Promise<Branch[]> => {
  const cacheKey = 'branches';
  const cached = apiCache.get<Branch[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const res = await apiClient.get("/branches");
  const data = res.data.data;
  apiCache.set(cacheKey, data, 10 * 60 * 1000); // Cache for 10 minutes
  return data;
};

export const getBranchById = async (id: number): Promise<Branch> => {
  const cacheKey = `branch_${id}`;
  const cached = apiCache.get<Branch>(cacheKey);
  if (cached) {
    return cached;
  }

  const res = await apiClient.get(`/branches/${id}`);
  const data = res.data.data;
  apiCache.set(cacheKey, data, 10 * 60 * 1000); // Cache for 10 minutes
  return data;
};

export const createBranch = async (data: CreateBranchRequest): Promise<Branch> => {
  const res = await apiClient.post("/branches", data);
  // Invalidate branches cache when branches are modified
  apiCache.clearPattern('branch');
  return res.data.data;
};

export const updateBranch = async (id: number, data: UpdateBranchRequest): Promise<Branch> => {
  const res = await apiClient.put(`/branches/${id}`, data);
  // Invalidate specific branch cache and branches list
  apiCache.clear(`branch_${id}`);
  apiCache.clear('branches');
  return res.data.data;
};

export const deactivateBranch = async (id: number): Promise<void> => {
  await apiClient.delete(`/branches/${id}`);
  // Invalidate specific branch cache and branches list
  apiCache.clear(`branch_${id}`);
  apiCache.clear('branches');
};