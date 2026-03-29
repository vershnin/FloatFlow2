import React, { createContext, useContext, useState, useCallback } from "react";
import apiClient from "@/api/apiClient";

export type UserRole =
  | "ADMIN"
  | "FINANCE_OFFICER"
  | "BRANCH_MANAGER"
  | "EMPLOYEE"
  | "AUDITOR";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, branchId?: number) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: "Admin",
  FINANCE_OFFICER: "Finance Officer",
  BRANCH_MANAGER: "Branch Manager",
  EMPLOYEE: "Employee",
  AUDITOR: "Auditor",
};

export const ROLE_HOME: Record<UserRole, string> = {
  ADMIN: "/",
  FINANCE_OFFICER: "/",
  BRANCH_MANAGER: "/",
  EMPLOYEE: "/",
  AUDITOR: "/",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("ff_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/login", { email, password });
      const { token, name, role, userId, branchId } = response.data.data;
      const user: User = {
        id: String(userId),
        email,
        name,
        role,
        branchId,
      };
      localStorage.setItem("ff_token", token);
      localStorage.setItem("ff_user", JSON.stringify(user));
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole, branchId?: number) => {
    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = { name, email, password, role };
      if (branchId !== undefined) payload.branchId = branchId;
      const response = await apiClient.post("/auth/register", payload);
      const { token, name: resName, role: resRole, userId, branchId: resBranchId } = response.data.data;
      const user: User = {
        id: String(userId),
        email,
        name: resName,
        role: resRole,
        branchId: resBranchId,
      };
      localStorage.setItem("ff_token", token);
      localStorage.setItem("ff_user", JSON.stringify(user));
      setUser(user);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("ff_token");
    localStorage.removeItem("ff_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated: !!user, isLoading, login, register, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
