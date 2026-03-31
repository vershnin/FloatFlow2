import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { changeUserRole, type AdminUser } from "@/api/adminService";
import { ROLE_LABELS, type UserRole } from "@/context/AuthContext";
import { toast } from "sonner";
import { AlertTriangle } from "lucide-react";

interface ChangeRoleModalProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangeRoleModal({ open, user, onClose, onSuccess }: ChangeRoleModalProps) {
  const [role, setRole] = useState<UserRole>("EMPLOYEE");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && user) {
      setRole(user.role);
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (role === user.role) {
      toast.error("Please select a different role");
      return;
    }

    setIsSubmitting(true);
    try {
      await changeUserRole(user.id, role);
      toast.success(`User role changed to ${ROLE_LABELS[role]}`);
      onSuccess();
    } catch (error) {
      // Error handled by interceptor
    } finally {
      setIsSubmitting(false);
    }
  };

  const roles: UserRole[] = ["ADMIN", "FINANCE_OFFICER", "BRANCH_MANAGER", "EMPLOYEE", "AUDITOR"];

  if (!user) return null;

  const isSensitiveChange = (user.role === "ADMIN" || role === "ADMIN");

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Change User Role</DialogTitle>
        </DialogHeader>

        {isSensitiveChange && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-center gap-2 text-sm font-medium text-amber-800">
              <AlertTriangle className="h-4 w-4" /> Sensitive Action
            </div>
            <p className="text-xs text-amber-700 mt-1">
              Changing roles to/from Admin requires careful consideration. Ensure this user is trustworthy.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>User</Label>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">Current role: {ROLE_LABELS[user.role]}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>New Role *</Label>
            <Select value={role} onValueChange={(value) => setRole(value as UserRole)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r} value={r} disabled={r === user.role}>
                    {ROLE_LABELS[r]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || role === user.role}>
              {isSubmitting ? "Changing..." : "Change Role"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}