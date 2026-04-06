import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import RoleDashboard from "@/pages/RoleDashboard";
import FloatsPage from "@/pages/FloatsPage";
import ExpensesPage from "@/pages/ExpensesPage";
import ApprovalsPage from "@/pages/ApprovalsPage";
import PoliciesPage from "@/pages/PoliciesPage";
import ReportsPage from "@/pages/ReportsPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import IntegrationsPage from "@/pages/IntegrationsPage";
import SettingsPage from "@/pages/SettingsPage";
import LoginPage from "@/pages/LoginPage";
import RegisterPage from "@/pages/RegisterPage";
import ForgotPasswordPage from "@/pages/ForgotPasswordPage";
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import LandingPage from "@/pages/LandingPage";
import NotFound from "./pages/NotFound";
import AdminUserManagementPage from "@/pages/AdminUserManagementPage";
import BranchManagementPage from "@/pages/BranchManagementPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors (client errors)
        if (error?.response?.status >= 400 && error?.response?.status < 500) {
          return false;
        }
        // Retry up to 3 times for other errors
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/landing" element={<LandingPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/reset-password" element={<ResetPasswordPage />} />

              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout>
                      <Routes>
                        <Route path="/" element={<RoleDashboard />} />
                        <Route
                          path="/floats"
                          element={
                            <ProtectedRoute allowedRoles={["ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER"]}>
                              <FloatsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/expenses"
                          element={
                            <ProtectedRoute allowedRoles={["ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER", "EMPLOYEE"]}>
                              <ExpensesPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/approvals"
                          element={
                            <ProtectedRoute allowedRoles={["ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER"]}>
                              <ApprovalsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/policies"
                          element={
                            <ProtectedRoute allowedRoles={["ADMIN", "FINANCE_OFFICER"]}>
                              <PoliciesPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/reports"
                          element={
                            <ProtectedRoute allowedRoles={["ADMIN", "FINANCE_OFFICER", "AUDITOR"]}>
                              <ReportsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/audit-logs"
                          element={
                            <ProtectedRoute allowedRoles={["ADMIN", "AUDITOR"]}>
                              <AuditLogsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/users"
                          element={
                            <ProtectedRoute allowedRoles={["ADMIN"]}>
                              <AdminUserManagementPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/admin/branches"
                          element={
                            <ProtectedRoute allowedRoles={["ADMIN"]}>
                              <BranchManagementPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/integrations"
                          element={
                            <ProtectedRoute allowedRoles={["ADMIN"]}>
                              <IntegrationsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route
                          path="/settings"
                          element={
                            <ProtectedRoute allowedRoles={["ADMIN"]}>
                              <SettingsPage />
                            </ProtectedRoute>
                          }
                        />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </DashboardLayout>
                  </ProtectedRoute>
                }
              />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
  </ErrorBoundary>
);

export default App;
