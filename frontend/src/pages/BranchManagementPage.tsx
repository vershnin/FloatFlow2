import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Edit, PowerOff, Power, MoreHorizontal } from "lucide-react";
import {
  getBranches, activateBranch, deactivateBranch, invalidateBranchesCache,
  type Branch,
} from "@/api/branchService";
import { getUsers, type AdminUser } from "@/api/adminService";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateBranchModal } from "@/components/CreateBranchModal";
import { EditBranchModal } from "@/components/EditBranchModal";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { debounce } from "@/lib/performance";

export default function BranchManagementPage() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchManagers, setBranchManagers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: "deactivate" | "activate";
    branch: Branch;
  } | null>(null);

  const debouncedSetSearch = useMemo(
    () => debounce((q: string) => setDebouncedSearch(q), 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);

  const loadBranches = async () => {
    setLoading(true);
    invalidateBranchesCache();
    try {
      const data = await getBranches();
      setBranches(data);
    } catch {
      toast.error("Failed to load branches");
    } finally {
      setLoading(false);
    }
  };

  const loadBranchManagers = async () => {
    try {
      const managers = await getUsers({ role: "BRANCH_MANAGER", isActive: true });
      setBranchManagers(managers);
    } catch {
      toast.error("Failed to load branch managers");
    }
  };

  useEffect(() => {
    loadBranches();
    loadBranchManagers();
  }, []);

  const filtered = branches.filter((b) => {
    if (statusFilter === "active" && !b.isActive) return false;
    if (statusFilter === "inactive" && b.isActive) return false;
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      return (
        b.name.toLowerCase().includes(q) ||
        b.location.toLowerCase().includes(q) ||
        (b.managerName?.toLowerCase().includes(q) ?? false)
      );
    }
    return true;
  });

  const handleDeactivate = async (branch: Branch) => {
    try {
      await deactivateBranch(branch.id);
      toast.success(`Branch "${branch.name}" deactivated`);
      loadBranches();
    } catch {
      toast.error("Failed to deactivate branch");
    }
  };

  const handleActivate = async (branch: Branch) => {
    try {
      await activateBranch(branch.id);
      toast.success(`Branch "${branch.name}" activated`);
      loadBranches();
    } catch {
      toast.error("Failed to activate branch");
    }
  };

  const activeCount   = branches.filter((b) => b.isActive).length;
  const inactiveCount = branches.filter((b) => !b.isActive).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading branches...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Branch Management"
        description="Create, edit and manage company branches"
      >
        <Button onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4" /> Create Branch
        </Button>
      </PageHeader>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(
          [
            { key: "all",      label: `All (${branches.length})` },
            { key: "active",   label: `Active (${activeCount})` },
            { key: "inactive", label: `Inactive (${inactiveCount})` },
          ] as const
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setStatusFilter(key)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
              statusFilter === key
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-secondary-foreground hover:bg-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search branches..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Table */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card"
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Branch Name</th>
                <th className="px-5 py-3 font-medium">Location</th>
                <th className="px-5 py-3 font-medium">Manager</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Created</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-muted-foreground">
                    No branches found
                  </td>
                </tr>
              ) : (
                filtered.map((branch) => (
                  <tr
                    key={branch.id}
                    className={`border-b last:border-0 hover:bg-muted/50 transition-colors ${
                      !branch.isActive ? "opacity-60" : ""
                    }`}
                  >
                    <td className="px-5 py-3 font-medium">{branch.name}</td>
                    <td className="px-5 py-3 text-muted-foreground">{branch.location}</td>
                    <td className="px-5 py-3">
                      {branch.managerName ? (
                        <div>
                          <p className="font-medium leading-tight">{branch.managerName}</p>
                          {branch.managerEmail && (
                            <p className="text-xs text-muted-foreground">{branch.managerEmail}</p>
                          )}
                        </div>
                      ) : (
                        <Badge variant="outline" className="text-xs text-muted-foreground">
                          Unassigned
                        </Badge>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge status={branch.isActive ? "active" : "inactive"} />
                    </td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(branch.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBranch(branch);
                              setEditModalOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" /> Edit Branch
                          </DropdownMenuItem>
                          {branch.isActive ? (
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() =>
                                setConfirmAction({ type: "deactivate", branch })
                              }
                            >
                              <PowerOff className="h-4 w-4" /> Deactivate
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() =>
                                setConfirmAction({ type: "activate", branch })
                              }
                            >
                              <Power className="h-4 w-4" /> Activate
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

      {/* Modals */}
      <CreateBranchModal
        open={createModalOpen}
        branchManagers={branchManagers}
        onClose={() => setCreateModalOpen(false)}
        onSuccess={() => {
          setCreateModalOpen(false);
          loadBranches();
          loadBranchManagers();
        }}
      />

      <EditBranchModal
        open={editModalOpen}
        branch={selectedBranch}
        branchManagers={branchManagers}
        onClose={() => { setEditModalOpen(false); setSelectedBranch(null); }}
        onSuccess={() => {
          setEditModalOpen(false);
          setSelectedBranch(null);
          loadBranches();
          loadBranchManagers();
        }}
      />

      {/* Confirm deactivate / activate */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === "deactivate" ? "Deactivate Branch" : "Activate Branch"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === "deactivate"
                ? `Are you sure you want to deactivate "${confirmAction.branch.name}"? It will no longer be selectable for new users or floats.`
                : `Are you sure you want to reactivate "${confirmAction?.branch.name}"?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={
                confirmAction?.type === "deactivate"
                  ? "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  : ""
              }
              onClick={() => {
                if (!confirmAction) return;
                if (confirmAction.type === "deactivate") {
                  handleDeactivate(confirmAction.branch);
                } else {
                  handleActivate(confirmAction.branch);
                }
                setConfirmAction(null);
              }}
            >
              {confirmAction?.type === "deactivate" ? "Deactivate" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
