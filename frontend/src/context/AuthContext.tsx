import React, { createContext, useContext, useState, useCallback } from "react";
import apiClient from "@/api/apiClient";
import { SecureStorage, sanitizeText, isValidEmail, isValidPassword } from "@/lib/security";
import { setUser as setMonitoringUser, clearUser as clearMonitoringUser } from "@/lib/monitoring";

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
  branchName?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole, branchId?: number) => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  resetPassword: (token: string, newPassword: string) => Promise<void>;
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
    const stored = SecureStorage.getItem("ff_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(async (email: string, password: string) => {
    // Input validation
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }
    if (!password || password.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    setIsLoading(true);
    try {
      const response = await apiClient.post("/auth/login", {
        email: sanitizeText(email),
        password: sanitizeText(password)
      });
      const { token, name, role, userId, branchId, isActive = true, createdAt = new Date().toISOString() } = response.data.data;
      const user: User = {
        id: String(userId),
        email,
        name,
        role,
        branchId,
        isActive,
        createdAt,
      };
      SecureStorage.setItem("ff_token", token);
      SecureStorage.setItem("ff_user", JSON.stringify(user));
      setUser(user);
      // Set user context for monitoring
      setMonitoringUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string, role: UserRole, branchId?: number) => {
    // Input validation
    if (!name || name.trim().length < 2) {
      throw new Error("Name must be at least 2 characters");
    }
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }
    if (!isValidPassword(password)) {
      throw new Error("Password must be at least 8 characters with uppercase, lowercase, and number");
    }

    setIsLoading(true);
    try {
      const payload: Record<string, unknown> = {
        name: sanitizeText(name),
        email: sanitizeText(email),
        password: sanitizeText(password),
        role
      };
      if (branchId !== undefined) payload.branchId = branchId;
      const response = await apiClient.post("/auth/register", payload);
      const { token, name: resName, role: resRole, userId, branchId: resBranchId, isActive = true, createdAt = new Date().toISOString() } = response.data.data;
      const user: User = {
        id: String(userId),
        email,
        name: resName,
        role: resRole,
        branchId: resBranchId,
        isActive,
        createdAt,
      };
      SecureStorage.setItem("ff_token", token);
      SecureStorage.setItem("ff_user", JSON.stringify(user));
      setUser(user);
      // Set user context for monitoring
      setMonitoringUser({
        id: user.id,
        email: user.email,
        role: user.role,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    SecureStorage.removeItem("ff_token");
    SecureStorage.removeItem("ff_user");
    setUser(null);
    // Clear user context for monitoring
    clearMonitoringUser();
  }, []);

  const requestPasswordReset = useCallback(async (email: string) => {
    if (!isValidEmail(email)) {
      throw new Error("Invalid email format");
    }

    await apiClient.post("/auth/forgot-password", {
      email: sanitizeText(email),
    });
  }, []);

  const resetPassword = useCallback(async (token: string, newPassword: string) => {
    if (!token || token.trim().length === 0) {
      throw new Error("Reset token is missing");
    }
    if (newPassword.length < 8) {
      throw new Error("Password must be at least 8 characters");
    }

    await apiClient.post("/auth/reset-password", {
      token: sanitizeText(token),
      newPassword: sanitizeText(newPassword),
    });
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        requestPasswordReset,
        resetPassword,
        logout,
      }}
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
