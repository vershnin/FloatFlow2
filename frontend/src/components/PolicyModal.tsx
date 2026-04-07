import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { createPolicy, updatePolicy, type PolicyResponse } from "@/api/policyService";
import { toast } from "sonner";

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
  policy?: PolicyResponse | null;
  onSuccess: () => void;
}

export function PolicyModal({ open, onClose, policy, onSuccess }: PolicyModalProps) {
  const isEdit = !!policy;
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [dailyLimit, setDailyLimit] = useState("");
  const [enabled, setEnabled] = useState(policy?.enabled ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(policy?.name ?? "");
    setCategory(policy?.category ?? "");
    setMaxAmount(policy?.maxAmount?.toString() ?? "");
    setDailyLimit(policy?.dailyLimit?.toString() ?? "");
    setEnabled(policy?.enabled ?? true);
  }, [open, policy]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !category || !maxAmount || !dailyLimit) {
      toast.error("Please fill all required fields");
      return;
    }

    const payload = {
      name: name.trim(),
      category: category.trim(),
      maxAmount: Number(maxAmount),
      dailyLimit: Number(dailyLimit),
    };

    if (!Number.isFinite(payload.maxAmount) || payload.maxAmount <= 0 || !Number.isFinite(payload.dailyLimit) || payload.dailyLimit <= 0) {
      toast.error("Amounts must be positive numbers");
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEdit && policy) {
        await updatePolicy(policy.id, { ...payload, enabled });
        toast.success("Policy updated successfully");
      } else {
        const created = await createPolicy(payload);
        if (!enabled) {
          await updatePolicy(created.id, { enabled: false });
        }
        toast.success("Policy created successfully");
      }
      onSuccess();
    } catch {
      toast.error(isEdit ? "Failed to update policy" : "Failed to create policy");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Policy" : "Create Policy"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Policy Name *</Label>
            <Input placeholder="e.g. Travel Policy" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Category *</Label>
              <Input placeholder="e.g. Transport" value={category} onChange={(e) => setCategory(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Max Amount (KES) *</Label>
              <Input type="number" min="1" step="0.01" placeholder="e.g. 5000" value={maxAmount} onChange={(e) => setMaxAmount(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Daily Limit (KES) *</Label>
            <Input type="number" min="1" step="0.01" placeholder="e.g. 15000" value={dailyLimit} onChange={(e) => setDailyLimit(e.target.value)} required />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3">
            <div>
              <Label>Enabled</Label>
              <p className="text-xs text-muted-foreground">Policy will be enforced when enabled</p>
            </div>
            <Switch checked={enabled} onCheckedChange={setEnabled} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : isEdit ? "Update Policy" : "Create Policy"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
