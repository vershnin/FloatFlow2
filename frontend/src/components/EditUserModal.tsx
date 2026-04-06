import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateUser, activateUser, deactivateUser, type AdminUser, type UpdateUserRequest } from "@/api/adminService";
import { getBranches, type Branch } from "@/api/branchService";
import { toast } from "sonner";

interface EditUserModalProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

const NO_BRANCH_VALUE = "__no_branch__";

export function EditUserModal({ open, user, onClose, onSuccess }: EditUserModalProps) {
  const [name, setName]         = useState("");
  const [email, setEmail]       = useState("");
  const [branchId, setBranchId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setEmail(user.email);
      setBranchId(user.branchId ? String(user.branchId) : "");
      setIsActive(user.isActive);
    }
    if (open) {
      getBranches().then(setBranches).catch(() => {});
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !email) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      const data: UpdateUserRequest = { name, email };
      if (branchId) {
        data.branchId = Number(branchId);
      } else {
        data.branchId = undefined;
      }
      await updateUser(user.id, data);

      if (isActive !== user.isActive) {
        if (isActive) {
          await activateUser(user.id);
        } else {
          await deactivateUser(user.id);
        }
      }

      toast.success("User updated successfully");
      onSuccess();
    } catch (error) {
      // Error handled by apiClient interceptor toast
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Full Name *</Label>
            <Input
              placeholder="Enter full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Email Address *</Label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Branch (optional)</Label>
            <Select
              value={branchId || NO_BRANCH_VALUE}
              onValueChange={(value) => setBranchId(value === NO_BRANCH_VALUE ? "" : value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_BRANCH_VALUE}>No branch</SelectItem>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={String(b.id)}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="is-active"
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label htmlFor="is-active">Active</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Updating..." : "Update User"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}