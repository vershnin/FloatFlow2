import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { submitExpense, uploadReceipt } from "@/api/expenseService";
import { getFloats, getMyBranchActiveFloat, type FloatResponse } from "@/api/floatService";
import { getPolicies, type PolicyResponse } from "@/api/policyService";
import { AlertTriangle, Upload, X, FileText } from "lucide-react";
import { toast } from "sonner";
import axios from "axios";
import { sanitizeText, SecureStorage } from "@/lib/security";
import { useAuth } from "@/context/AuthContext";

const EXPENSE_CATEGORIES = [
  "Office Supplies", "Transport", "Meals & Entertainment", "Repairs & Maintenance",
  "Cleaning Services", "Courier & Postage", "Stationery", "Utilities", "Miscellaneous",
];

interface SubmitExpenseModalProps {
  open: boolean;
  onClose: () => void;
}

export function SubmitExpenseModal({ open, onClose }: SubmitExpenseModalProps) {
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [floatId, setFloatId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [violations, setViolations] = useState<string[]>([]);
  const [floats, setFloats] = useState<FloatResponse[]>([]);
  const [policies, setPolicies] = useState<PolicyResponse[]>([]);

  useEffect(() => {
    if (open) {
      const loadFloatOptions = async () => {
        try {
          if (user?.role === "EMPLOYEE") {
            const activeFloat = await getMyBranchActiveFloat();
            setFloats(activeFloat && activeFloat.status === "ACTIVE" ? [activeFloat] : []);
            return;
          }

          const availableFloats = await getFloats();
          setFloats(availableFloats.filter((float) => float.status === "ACTIVE"));
        } catch (error: any) {
          setFloats([]);
          const message = error?.response?.data?.message;
          if (message && open) {
            toast.error(message);
          }
        }
      };

      void loadFloatOptions();
      getPolicies().then(setPolicies).catch(() => {});
    }
  }, [open, user?.role]);

  const checkPolicies = (amt: number, cat: string) => {
    const v: string[] = [];
    for (const p of policies) {
      if (!p.enabled) continue;
      if (p.category === cat && amt > p.maxAmount) {
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

  const handleFileSelect = (file: File | null) => {
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB
        toast.error("File size must be less than 5MB");
        return;
      }
      setReceiptFile(file);
      
      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setReceiptPreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    } else {
      setReceiptFile(null);
      setReceiptPreview(null);
    }
  };

  const handleSubmit = async (mode: "DRAFT" | "PENDING") => {
    if (!amount || !category || !description || !floatId) {
      toast.error("Please fill all required fields");
      return;
    }
    setIsSubmitting(true);
    try {
      const expense = await submitExpense({
        amount: Number(amount),
        category: sanitizeText(category),
        description: sanitizeText(description),
        floatId: Number(floatId),
        status: mode,
      });

      // Upload receipt if provided
      if (receiptFile && expense.id) {
        try {
          setUploadProgress(0);
          const formData = new FormData();
          formData.append('receipt', receiptFile);
          
          const token = SecureStorage.getItem("ff_token");
          await axios.put(`/api/expenses/${expense.id}/receipt`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              ...(token && { Authorization: `Bearer ${token}` }),
            },
            onUploadProgress: (progressEvent) => {
              const percent = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
              setUploadProgress(percent);
            },
          });
          setUploadProgress(100);
          toast.success("Expense and receipt uploaded successfully");
        } catch (uploadError) {
          toast.warning("Expense submitted but receipt upload failed");
        } finally {
          setUploadProgress(0);
        }
      } else {
        toast.success(mode === "DRAFT" ? "Expense saved as draft" : "Expense submitted successfully");
      }

      setAmount(""); setCategory(""); setDescription(""); setFloatId(""); setReceiptFile(null); setReceiptPreview(null); setUploadProgress(0); setViolations([]);
      onClose();
    } catch (error: any) {
      if (error.response?.data?.policyViolations) {
        const serverViolations = error.response.data.policyViolations.map((v: any) => v.message);
        setViolations(serverViolations);
        toast.error(mode === "DRAFT" ? "Draft save failed" : "Expense submission blocked by policy");
      } else {
        toast.error(error.response?.data?.message || "Failed to submit expense");
      }
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
        <form onSubmit={(e) => { e.preventDefault(); void handleSubmit("PENDING"); }} className="space-y-4">
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
            {receiptFile ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {receiptPreview ? (
                      <img src={receiptPreview} alt="Receipt preview" className="h-10 w-10 object-cover rounded" />
                    ) : (
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    )}
                    <div>
                      <p className="text-sm font-medium">{receiptFile.name}</p>
                      <p className="text-xs text-muted-foreground">{(receiptFile.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleFileSelect(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/25 p-6 hover:border-muted-foreground/50 transition-colors">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    handleFileSelect(file || null);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="text-center">
                  <Upload className="h-8 w-8 mx-auto text-muted-foreground/50 mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Click to upload or drag & drop
                  </p>
                  <p className="text-xs text-muted-foreground/70">PNG, JPG, PDF up to 5MB</p>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" variant="secondary" disabled={isSubmitting || uploadProgress > 0} onClick={() => void handleSubmit("DRAFT")}>
              {isSubmitting ? "Saving..." : "Save Draft"}
            </Button>
            <Button type="submit" disabled={isSubmitting || violations.length > 0 || uploadProgress > 0}>
              {isSubmitting ? "Submitting..." : uploadProgress > 0 ? `Uploading... ${uploadProgress}%` : "Submit Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
