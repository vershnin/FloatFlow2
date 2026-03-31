import {
  LayoutDashboard, Wallet, Receipt, CheckSquare, ShieldCheck,
  BarChart3, FileText, Plug, Settings, ChevronLeft, Users,
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useAuth, ROLE_LABELS, type UserRole } from "@/context/AuthContext";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader,
  SidebarFooter, useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

interface NavItem {
  title: string;
  url: string;
  icon: React.ElementType;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard, roles: ["ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER", "EMPLOYEE", "AUDITOR"] },
  { title: "Admin User Management", url: "/admin/users", icon: Users, roles: ["ADMIN"] },
  { title: "Floats", url: "/floats", icon: Wallet, roles: ["ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER"] },
  { title: "Expenses", url: "/expenses", icon: Receipt, roles: ["ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER", "EMPLOYEE"] },
  { title: "Approvals", url: "/approvals", icon: CheckSquare, roles: ["ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER"] },
  { title: "Policies", url: "/policies", icon: ShieldCheck, roles: ["ADMIN", "FINANCE_OFFICER"] },
  { title: "Reports", url: "/reports", icon: BarChart3, roles: ["ADMIN", "FINANCE_OFFICER", "AUDITOR"] },
  { title: "Audit Logs", url: "/audit-logs", icon: FileText, roles: ["ADMIN", "AUDITOR"] },
  { title: "Integrations", url: "/integrations", icon: Plug, roles: ["ADMIN"] },
  { title: "Settings", url: "/settings", icon: Settings, roles: ["ADMIN"] },
];

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";
  const { user } = useAuth();
  const role = user?.role ?? "ADMIN";
  const filtered = navItems.filter((item) => item.roles.includes(role));

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent">
            <Wallet className="h-4 w-4 text-accent" />
          </div>
          {!collapsed && (
            <span className="text-lg font-bold text-sidebar-primary tracking-tight">FloatFlow</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          {!collapsed && (
            <SidebarGroupLabel className="text-sidebar-muted text-xs px-3">
              {ROLE_LABELS[role]}
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu>
              {filtered.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end={item.url === "/"}
                      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      activeClassName="bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-2">
        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="mx-auto text-sidebar-muted hover:text-sidebar-primary hover:bg-sidebar-accent">
          <ChevronLeft className={`h-4 w-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
        </Button>
      </SidebarFooter>
    </Sidebar>
  );
}
