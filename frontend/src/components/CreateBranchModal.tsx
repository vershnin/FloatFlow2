import { useState } from "react";
import axios from "axios";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createBranch } from "@/api/branchService";
import { toast } from "sonner";

interface CreateBranchModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateBranchModal({ open, onClose, onSuccess }: CreateBranchModalProps) {
  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setName("");
    setLocation("");
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      resetForm();
      onClose();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmedName = name.trim();
    const trimmedLocation = location.trim();

    if (!trimmedName || !trimmedLocation) {
      toast.error("Branch name and location are required");
      return;
    }

    setIsSubmitting(true);
    try {
      await createBranch({
        name: trimmedName,
        location: trimmedLocation,
      });
      toast.success("Branch created successfully");
      resetForm();
      onSuccess();
    } catch (error) {
      // Axios errors (4xx/5xx from backend) are already toasted by the apiClient interceptor.
      // Only surface our own thrown errors here (e.g. the frontend role guard).
      if (!axios.isAxiosError(error) && error instanceof Error && error.message) {
        toast.error(error.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Branch</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="branch-name">Branch Name *</Label>
            <Input
              id="branch-name"
              placeholder="e.g. Nairobi CBD"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="branch-location">Location *</Label>
            <Input
              id="branch-location"
              placeholder="e.g. Nairobi"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              maxLength={150}
              required
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Branch"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
