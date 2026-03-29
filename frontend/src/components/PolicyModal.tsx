import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { expenseCategories } from "@/mockData/expenses";
import { policyTypes, type Policy } from "@/mockData/policies";
import { toast } from "sonner";

interface PolicyModalProps {
  open: boolean;
  onClose: () => void;
  policy?: Policy | null;
}

export function PolicyModal({ open, onClose, policy }: PolicyModalProps) {
  const isEdit = !!policy;
  const [name, setName] = useState(policy?.name || "");
  const [description, setDescription] = useState(policy?.description || "");
  const [type, setType] = useState(policy?.type || "");
  const [category, setCategory] = useState(policy?.category || "");
  const [limit, setLimit] = useState(policy?.limit?.toString() || "");
  const [enabled, setEnabled] = useState(policy?.enabled ?? true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !type || !limit) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    toast.success(isEdit ? "Policy updated successfully" : "Policy created successfully");
    setIsSubmitting(false);
    onClose();
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
            <Input placeholder="e.g. Maximum Expense Amount" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea placeholder="Describe this policy..." value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Policy Type *</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                <SelectContent>
                  {policyTypes.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Limit (KES) *</Label>
              <Input type="number" min="1" placeholder="e.g. 50000" value={limit} onChange={(e) => setLimit(e.target.value)} required />
            </div>
          </div>
          {type === "category_limit" && (
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          )}
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
