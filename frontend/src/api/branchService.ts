import apiClient from "./apiClient";
import { apiCache } from "../lib/cache";
import { SecureStorage } from "../lib/security";

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

function normalizeBranches(data: unknown): Branch[] {
  if (Array.isArray(data)) return data as Branch[];
  if (data && typeof data === "object" && Array.isArray((data as { content?: unknown }).content)) {
    return (data as { content: Branch[] }).content;
  }
  return [];
}

export const getBranches = async (): Promise<Branch[]> => {
  const cacheKey = 'branches';
  const cached = apiCache.get<Branch[]>(cacheKey);
  if (cached) {
    return cached;
  }

  const res = await apiClient.get("/branches");
  const data = normalizeBranches(res.data.data);
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
  const storedUser = SecureStorage.getItem("ff_user");
  let role: string | undefined;
  if (storedUser) {
    try {
      role = JSON.parse(storedUser)?.role;
    } catch {
      role = undefined;
    }
  }

  if (role !== "ADMIN") {
    throw new Error("Only admins can create branches.");
  }

  const res = await apiClient.post("/branches", data);
  const created = res.data.data as Branch;

  // Invalidate branches cache when branches are modified
  apiCache.clearPattern('branch');
  const existing = apiCache.get<Branch[]>('branches') ?? [];
  const merged = [created, ...existing.filter((b) => b.id !== created.id)];
  apiCache.set('branches', merged, 10 * 60 * 1000);
  return created;
};

export const updateBranch = async (id: number, data: UpdateBranchRequest): Promise<Branch> => {
  const res = await apiClient.put(`/branches/${id}`, data);
  // Invalidate specific branch cache and branches list
  apiCache.clear(`branch_${id}`);
  apiCache.clear('branches');
  return res.data.data;
};

export const activateBranch = async (id: number): Promise<Branch> => {
  const current = await getBranchById(id);
  const res = await apiClient.put(`/branches/${id}`, {
    name: current.name,
    location: current.location,
    isActive: true,
  });
  apiCache.clear(`branch_${id}`);
  apiCache.clear('branches');
  return res.data.data;
};

export const deactivateBranch = async (id: number): Promise<void> => {
  await apiClient.delete(`/branches/${id}`);
  apiCache.clear(`branch_${id}`);
  apiCache.clear('branches');
};

/** Call before a management page load to always get fresh data from the server. */
export const invalidateBranchesCache = (): void => {
  apiCache.clearPattern('branch');
};