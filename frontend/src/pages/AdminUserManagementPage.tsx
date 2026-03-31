import { useState, useEffect } from "react";
import { Search, Plus, Filter, Edit, Trash2, UserCheck, Key, MoreHorizontal } from "lucide-react";
import { getUsers, deactivateUser, activateUser, resetUserPassword, type AdminUser, type UserFilters } from "@/api/adminService";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { CreateUserModal } from "@/components/CreateUserModal";
import { EditUserModal } from "@/components/EditUserModal";
import { ChangeRoleModal } from "@/components/ChangeRoleModal";
import { useAuth, ROLE_LABELS, type UserRole } from "@/context/AuthContext";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function AdminUserManagementPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<UserFilters>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deactivate' | 'activate' | 'reset-password';
    user: AdminUser;
  } | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getUsers(filters);
      setUsers(data);
    } catch (error) {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, [filters]);

  const filtered = users.filter((user) => {
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        user.name.toLowerCase().includes(q) ||
        user.email.toLowerCase().includes(q) ||
        user.role.toLowerCase().includes(q) ||
        (user.branchName && user.branchName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const handleDeactivate = async (user: AdminUser) => {
    try {
      await deactivateUser(user.id);
      toast.success(`User ${user.name} has been deactivated`);
      loadUsers();
    } catch (error) {
      toast.error("Failed to deactivate user");
    }
  };

  const handleActivate = async (user: AdminUser) => {
    try {
      const updatedUser = await activateUser(user.id);
      toast.success(`User ${updatedUser.name} has been activated`);
      loadUsers();
    } catch (error) {
      toast.error("Failed to activate user");
    }
  };

  const handleResetPassword = async (user: AdminUser) => {
    try {
      await resetUserPassword(user.id);
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error) {
      toast.error("Failed to reset password");
    }
  };

  const roles: UserRole[] = ["ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER", "EMPLOYEE", "AUDITOR"];

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading users...</div>;
  }

  return (
    <div>
      <PageHeader title="User Management" description="Manage user accounts, roles, and access">
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-1" /> Create User
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => setFilters({ ...filters, isActive: undefined })}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
            filters.isActive === undefined
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-muted"
          }`}
        >
          All ({users.length})
        </button>
        <button
          onClick={() => setFilters({ ...filters, isActive: true })}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
            filters.isActive === true
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-muted"
          }`}
        >
          Active ({users.filter(u => u.isActive).length})
        </button>
        <button
          onClick={() => setFilters({ ...filters, isActive: false })}
          className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
            filters.isActive === false
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-secondary-foreground hover:bg-muted"
          }`}
        >
          Inactive ({users.filter(u => !u.isActive).length})
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search users..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={filters.role || "all"}
          onValueChange={(value) => setFilters({ ...filters, role: value === "all" ? undefined : value as UserRole })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role} value={role}>{ROLE_LABELS[role]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={filters.branchId?.toString() || "all"}
          onValueChange={(value) => setFilters({ ...filters, branchId: value === "all" ? undefined : Number(value) })}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by branch" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Branches</SelectItem>
            {Array.from(
              new Map(
                users
                  .filter((u): u is AdminUser & { branchId: number; branchName: string } => !!u.branchId && !!u.branchName)
                  .map(u => [u.branchId, { id: u.branchId, name: u.branchName }] as const)
              ).values()
            ).map((branch) => (
              <SelectItem key={branch.id} value={branch.id.toString()}>{branch.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Name</th>
                <th className="px-5 py-3 font-medium">Email</th>
                <th className="px-5 py-3 font-medium">Role</th>
                <th className="px-5 py-3 font-medium">Branch</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Last Login</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No users found</td></tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user.id} className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${!user.isActive ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-3 font-medium">{user.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{user.email}</td>
                    <td className="px-5 py-3">
                      <Badge variant="secondary">{ROLE_LABELS[user.role]}</Badge>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">{user.branchName || '-'}</td>
                    <td className="px-5 py-3">
                      <StatusBadge status={user.isActive ? 'active' : 'inactive'} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'}
                    </td>
                    <td className="px-5 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setEditModalOpen(true); }}>
                            <Edit className="h-4 w-4 mr-2" /> Edit User
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => { setSelectedUser(user); setChangeRoleModalOpen(true); }}>
                            <UserCheck className="h-4 w-4 mr-2" /> Change Role
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setConfirmAction({ type: 'reset-password', user })}>
                            <Key className="h-4 w-4 mr-2" /> Reset Password
                          </DropdownMenuItem>
                          {user.isActive ? (
                            <DropdownMenuItem
                              onClick={() => setConfirmAction({ type: 'deactivate', user })}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => setConfirmAction({ type: 'activate', user })}>
                              <UserCheck className="h-4 w-4 mr-2" /> Activate
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <CreateUserModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => { setCreateModalOpen(false); loadUsers(); }}
      />

      <EditUserModal
        open={editModalOpen}
        user={selectedUser}
        onClose={() => { setEditModalOpen(false); setSelectedUser(null); }}
        onSuccess={() => { setEditModalOpen(false); setSelectedUser(null); loadUsers(); }}
      />

      <ChangeRoleModal
        open={changeRoleModalOpen}
        user={selectedUser}
        onClose={() => { setChangeRoleModalOpen(false); setSelectedUser(null); }}
        onSuccess={() => { setChangeRoleModalOpen(false); setSelectedUser(null); loadUsers(); }}
      />

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'deactivate' && 'Deactivate User'}
              {confirmAction?.type === 'activate' && 'Activate User'}
              {confirmAction?.type === 'reset-password' && 'Reset Password'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'deactivate' && `Are you sure you want to deactivate ${confirmAction.user.name}? They will lose access to the system.`}
              {confirmAction?.type === 'activate' && `Are you sure you want to reactivate ${confirmAction.user.name}? They will regain access to the system.`}
              {confirmAction?.type === 'reset-password' && `Are you sure you want to reset the password for ${confirmAction.user.name}? A reset email will be sent to ${confirmAction.user.email}.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction) {
                  if (confirmAction.type === 'deactivate') handleDeactivate(confirmAction.user);
                  else if (confirmAction.type === 'activate') handleActivate(confirmAction.user);
                  else if (confirmAction.type === 'reset-password') handleResetPassword(confirmAction.user);
                  setConfirmAction(null);
                }
              }}
              className={confirmAction?.type === 'deactivate' ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90' : ''}
            >
              {confirmAction?.type === 'deactivate' && 'Deactivate'}
              {confirmAction?.type === 'activate' && 'Activate'}
              {confirmAction?.type === 'reset-password' && 'Reset Password'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}