import apiClient from "./apiClient";
import { UserRole } from "@/context/AuthContext";

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId?: number;
  branchName?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  role: UserRole;
  branchId?: number;
  password: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: UserRole;
  branchId?: number;
  isActive?: boolean;
}

export interface UserFilters {
  search?: string;
  role?: UserRole;
  isActive?: boolean;
  branchId?: number;
}

export const getUsers = async (filters?: UserFilters): Promise<AdminUser[]> => {
  const params = new URLSearchParams();
  if (filters?.search) params.append("search", filters.search);
  if (filters?.role) params.append("role", filters.role);
  if (filters?.isActive !== undefined) params.append("isActive", filters.isActive.toString());
  if (filters?.branchId) params.append("branchId", filters.branchId.toString());

  const res = await apiClient.get(`/admin/users?${params.toString()}`);
  return res.data.data;
};

export const getUserById = async (id: string): Promise<AdminUser> => {
  const res = await apiClient.get(`/admin/users/${id}`);
  return res.data.data;
};

export const createUser = async (data: CreateUserRequest): Promise<AdminUser> => {
  const res = await apiClient.post("/admin/users", data);
  return res.data.data;
};

export const updateUser = async (id: string, data: UpdateUserRequest): Promise<AdminUser> => {
  const res = await apiClient.put(`/admin/users/${id}`, data);
  return res.data.data;
};

export const deactivateUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/admin/users/${id}`);
};

export const activateUser = async (id: string): Promise<AdminUser> => {
  const res = await apiClient.post(`/admin/users/${id}/activate`);
  return res.data.data;
};

export const changeUserRole = async (id: string, role: UserRole): Promise<AdminUser> => {
  const res = await apiClient.put(`/admin/users/${id}/role`, { role });
  return res.data.data;
};

export const resetUserPassword = async (id: string): Promise<void> => {
  await apiClient.post(`/admin/users/${id}/reset-password`);
};