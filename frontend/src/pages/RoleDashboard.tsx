import { useAuth, type UserRole } from "@/context/AuthContext";
import Dashboard from "@/pages/Dashboard";
import FinanceOfficerDashboard from "@/pages/FinanceOfficerDashboard";
import BranchManagerDashboard from "@/pages/BranchManagerDashboard";
import EmployeeDashboard from "@/pages/EmployeeDashboard";
import AuditorDashboard from "@/pages/AuditorDashboard";

const dashboardMap: Record<UserRole, React.ComponentType> = {
  ADMIN: Dashboard,
  FINANCE_OFFICER: FinanceOfficerDashboard,
  BRANCH_MANAGER: BranchManagerDashboard,
  EMPLOYEE: EmployeeDashboard,
  AUDITOR: AuditorDashboard,
};

export default function RoleDashboard() {
  const { user } = useAuth();
  const role = user?.role ?? "ADMIN";
  const Component = dashboardMap[role];
  return <Component />;
}
