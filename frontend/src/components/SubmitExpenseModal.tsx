import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitExpense } from "@/api/expenseService";
import { getFloats, type FloatResponse } from "@/api/floatService";
import { getPolicies, type PolicyResponse } from "@/api/policyService";
import { AlertTriangle, Upload } from "lucide-react";
import { toast } from "sonner";

const EXPENSE_CATEGORIES = [
  "Office Supplies", "Transport", "Meals & Entertainment", "Repairs & Maintenance",
  "Cleaning Services", "Courier & Postage", "Stationery", "Utilities", "Miscellaneous",
];

interface SubmitExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubmitExpenseModal({ open, onClose }: SubmitExpenseModalProps) {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [floatId, setFloatId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [floats, setFloats] = useState<FloatResponse[]>([]);
  const [policies, setPolicies] = useState<PolicyResponse[]>([]);

  useEffect(() => {
    if (open) {
      getFloats().then(setFloats).catch(() => {});
      getPolicies().then(setPolicies).catch(() => {});
    }
  }, [open]);

  const checkPolicies = (amt: number, cat: string) => {
    const v: string[] = [];
    for (const p of policies) {
      if (!p.enabled) continue;
      if (amt > p.maxAmount) {
        v.push(`Exceeds maximum expense limit of KES ${p.maxAmount.toLocaleString()} (${p.name})`);
      }
      if (p.category === cat && amt > p.dailyLimit) {
        v.push(`Exceeds ${cat} daily limit of KES ${p.dailyLimit.toLocaleString()} (${p.name})`);
      }
    }
    return v;
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    if (val && category) setViolations(checkPolicies(Number(val), category));
    else setViolations([]);
  };

  const handleCategoryChange = (val: string) => {
    setCategory(val);
    if (amount && val) setViolations(checkPolicies(Number(amount), val));
    else setViolations([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (violations.length > 0) {
      toast.error("Cannot submit — policy violations detected");
      return;
    }
    if (!amount || !category || !description || !floatId) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      await submitExpense({
        amount: Number(amount),
        category,
        description,
        floatId: Number(floatId),
      });
      toast.success("Expense submitted successfully");
      setAmount(""); setCategory(""); setDescription(""); setFloatId(""); setViolations([]);
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Submit Expense</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {violations.length > 0 && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 space-y-1">
              <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                <AlertTriangle className="h-4 w-4" /> Policy Violation
              </div>
              {violations.map((v, i) => (
                <p key={i} className="text-xs text-destructive/80 pl-6">• {v}</p>
              ))}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Amount (KES) *</Label>
              <Input type="number" min="1" placeholder="e.g. 5000" value={amount} onChange={(e) => handleAmountChange(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Float / Branch *</Label>
            <Select value={floatId} onValueChange={setFloatId}>
              <SelectTrigger><SelectValue placeholder="Select float" /></SelectTrigger>
              <SelectContent>
                {floats.map((f) => (
                  <SelectItem key={f.id} value={String(f.id)}>
                    {f.branchName} — KES {f.currentBalance.toLocaleString()} remaining
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea placeholder="Describe the expense..." value={description} onChange={(e) => setDescription(e.target.value)} required />
          </div>

          <div className="space-y-2">
            <Label>Receipt (optional)</Label>
            <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 hover:border-muted-foreground/50 transition-colors cursor-pointer">
              <div className="text-center">
                <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                <p className="text-sm text-muted-foreground">Click to upload or drag & drop</p>
                <p className="text-xs text-muted-foreground/70">PNG, JPG, PDF up to 5MB</p>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting || violations.length > 0}>
              {isSubmitting ? "Submitting..." : "Submit Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
