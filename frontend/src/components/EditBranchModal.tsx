import { useState, useEffect } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { updateBranch, type Branch } from "@/api/branchService";
import { type AdminUser } from "@/api/adminService";
import { toast } from "sonner";

interface EditBranchModalProps {
  open: boolean;
  branch: Branch | null;
  onClose: () => void;
  onSuccess: () => void;
  branchManagers: AdminUser[];
}

const NO_MANAGER_VALUE = "__no_manager__";

export function EditBranchModal({ open, branch, onClose, onSuccess, branchManagers }: EditBranchModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [managerId, setManagerId] = useState(NO_MANAGER_VALUE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (open && branch) {
      setName(branch.name);
      setLocation(branch.location);

      const matchedManager = branch.managerEmail
        ? branchManagers.find((manager) => manager.email === branch.managerEmail)
        : undefined;
      setManagerId(matchedManager ? matchedManager.id : NO_MANAGER_VALUE);
    }
  }, [open, branch, branchManagers]);

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch) return;

    const trimmedName = name.trim();
    const trimmedLocation = location.trim();

    if (!trimmedName || !trimmedLocation) {
      toast.error("Branch name and location are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await updateBranch(branch.id, {
        name: trimmedName,
        location: trimmedLocation,
        managerId: managerId === NO_MANAGER_VALUE ? undefined : Number(managerId),
      });
      toast.success("Branch updated successfully");
      onSuccess();
    } catch (error) {
      // Axios 4xx/5xx toasted by apiClient interceptor; only handle local errors here.
      if (!axios.isAxiosError(error) && error instanceof Error && error.message) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!branch) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-branch-name">Branch Name *</Label>
            <Input
              id="edit-branch-name"
              placeholder="e.g. Nairobi CBD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-branch-location">Location *</Label>
            <Input
              id="edit-branch-location"
              placeholder="e.g. Nairobi"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={150}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Branch Manager (optional)</Label>
            <Select value={managerId} onValueChange={setManagerId}>
              <SelectTrigger>
                <SelectValue placeholder="Assign branch manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_MANAGER_VALUE}>No manager</SelectItem>
                {branchManagers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id}>
                    {manager.name} ({manager.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
