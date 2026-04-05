import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createFloat, topUpFloat } from "@/api/floatService";
import apiClient from "@/api/apiClient";
import { toast } from "sonner";

interface Branch {
  id: number;
  name: string;
  location: string;
}

interface AllocateFloatModalProps {
  open: boolean;
  onClose: () => void;
  mode: "allocate" | "topup";
  floatId?: number;
}

export function AllocateFloatModal({ open, onClose, mode, floatId }: AllocateFloatModalProps) {
  const [branchId, setBranchId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (open && mode === "allocate") {
      apiClient.get("/branches")
        .then((res) => setBranches(res.data.data ?? []))
        .catch(() => toast.error("Could not load branches"));
    }
  }, [open, mode]);

  // Reset form state when modal opens
  useEffect(() => {
    if (open) {
      setAmount("");
      setReference("");
      setBranchId("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }
    if (mode === "allocate" && !branchId) {
      toast.error("Please select a branch");
      return;
    }

    setIsSubmitting(true);
    try {
      if (mode === "allocate") {
        await createFloat({ branchId: Number(branchId), initialAmount: Number(amount) });
        toast.success(`Float allocated — KES ${Number(amount).toLocaleString()}`);
      } else if (floatId) {
        await topUpFloat(floatId, { amount: Number(amount), reference: reference || undefined });
        toast.success(`Float topped up — KES ${Number(amount).toLocaleString()}`);
      }
      onClose();
    } catch (error: any) {
    
      const msg = error?.response?.data?.message;
      if (!msg) {
        toast.error(mode === "allocate" ? "Failed to allocate float" : "Failed to top up float");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "allocate" ? "Allocate Float" : "Top-up Float"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "allocate" && (
            <div className="space-y-2">
              <Label>Branch *</Label>
              <Select value={branchId} onValueChange={setBranchId}>
                <SelectTrigger><SelectValue placeholder="Select branch" /></SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>{b.name} — {b.location}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="space-y-2">
            <Label>Amount (KES) *</Label>
            <Input
              type="number"
              min="1"
              placeholder="e.g. 100000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Reference / Notes</Label>
            <Textarea
              placeholder="e.g. Q1 allocation, Emergency top-up..."
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : mode === "allocate" ? "Allocate" : "Top Up"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}