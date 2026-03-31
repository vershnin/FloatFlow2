import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { updateUser, type AdminUser, type UpdateUserRequest } from "@/api/adminService";
import { getFloats, type FloatResponse } from "@/api/floatService";
import { toast } from "sonner";

interface EditUserModalProps {
  open: boolean;
  user: AdminUser | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function EditUserModal({ open, user, onClose, onSuccess }: EditUserModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [branchId, setBranchId] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [floats, setFloats] = useState<FloatResponse[]>([]);

  useEffect(() => {
    if (open && user) {
      setName(user.name);
      setEmail(user.email);
      setBranchId(user.branchId ? String(user.branchId) : "");
      setIsActive(user.isActive);
    }
    if (open) {
      getFloats().then(setFloats).catch(() => {});
    }
  }, [open, user]);

  // Get unique branches from floats
  const branches = Array.from(
    new Map(floats.map(f => [f.branchId, { id: f.branchId, name: f.branchName }])).values()
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !name || !email) {
      toast.error("Please fill all required fields");
      return;
    }

    const data: UpdateUserRequest = {
      name,
      email,
      isActive,
    };

    if (branchId) {
      data.branchId = Number(branchId);
    } else {
      data.branchId = undefined; // Allow clearing branch
    }

    setIsSubmitting(true);
    try {
      await updateUser(user.id, data);
      toast.success("User updated successfully");
      onSuccess();
    } catch (error) {
      // Error handled by interceptor
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
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Select branch" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No branch</SelectItem>
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
            <Button type="button" variant="outline" onClick={onClose}>
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