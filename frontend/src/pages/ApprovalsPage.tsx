import { useState, useEffect } from "react";
import {
  CheckCircle2, XCircle, Clock, FileText, AlertTriangle,
} from "lucide-react";
import {
  getPendingExpenses,
  getBranchExpenses,
  getExpenses,
  approveExpense,
  rejectExpense,
  type ExpenseResponse,
} from "@/api/expenseService";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { sendPendingApprovalReminderEmails } from "@/api/emailService";

export default function ApprovalsPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("PENDING");
  const [detailModal, setDetailModal] = useState<ExpenseResponse | null>(null);
  const [comment, setComment] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = user?.role === "BRANCH_MANAGER"
        ? await getBranchExpenses()
        : user?.role === "FINANCE_OFFICER" || user?.role === "ADMIN"
          ? await getExpenses()
          : await getPendingExpenses();
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadExpenses();
  }, [user?.role]);

  const handleAction = async (id: number, action: "APPROVED" | "REJECTED") => {
    setActionLoading(true);
    try {
      if (action === "APPROVED") {
        await approveExpense(id, comment || undefined);
      } else {
        await rejectExpense(id, comment || undefined);
      }
      toast.success(
        `Expense ${action === "APPROVED" ? "approved" : "rejected"} successfully`
      );
      setDetailModal(null);
      setComment("");
      loadExpenses();
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendPendingReminders = async () => {
    const pendingExpenses = expenses.filter((e) => e.status === "PENDING");
    if (!pendingExpenses.length) {
      toast.error("No pending approvals to remind");
      return;
    }
    if (!user?.email || !user?.name) {
      toast.error("Missing reviewer profile details for email reminders");
      return;
    }

    try {
      const result = await sendPendingApprovalReminderEmails(
        pendingExpenses,
        user.name,
        user.email
      );
      if (result.delivered) {
        toast.success(result.message);
      } else {
        toast.message(result.message);
      }
    } catch {
      toast.error("Failed to send pending approval reminder emails");
    }
  };

  // Treat "APPROVED" tab as "processed" (APPROVED + REJECTED) while preserving row status badges.
  const filtered = expenses.filter((e) => {
    if (statusFilter === "all") return true;
    if (statusFilter === "APPROVED") return e.status === "APPROVED" || e.status === "REJECTED";
    return e.status === statusFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading approvals...
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Approvals"
        description={`${expenses.filter((e) => e.status === "PENDING").length} pending approval(s)`}
      />

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {(["PENDING", "APPROVED", "REJECTED", "all"] as const).map((s) => (
          <Button
            key={s}
            onClick={() => setStatusFilter(s)}
            variant={statusFilter === s ? "default" : "secondary"}
            size="sm"
            className="capitalize"
            aria-label={`Filter by ${s.toLowerCase()} expenses`}
            aria-pressed={statusFilter === s}
          >
            {s.toLowerCase()} (
            {s === "all"
              ? expenses.length
              : expenses.filter((e) => e.status === s).length}
            )
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={() => void handleSendPendingReminders()}
          aria-label="Send pending approval reminder emails"
        >
          Send Pending Reminders
        </Button>
      </div>

      {/* Expense cards */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="glass-card p-12 text-center">
            <CheckCircle2 className="h-10 w-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">
              No {statusFilter.toLowerCase()} approvals
            </p>
          </div>
        )}
        {filtered.map((exp, i) => (
          <motion.div
            key={exp.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="glass-card p-5"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-sm font-bold text-primary">
                    #{exp.id}
                  </span>
                  <StatusBadge status={exp.status.toLowerCase()} />
                  {exp.amount > 25000 && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-warning/10 text-warning px-2 py-0.5 text-xs font-medium">
                      <AlertTriangle className="h-3 w-3" /> High Value
                    </span>
                  )}
                </div>
                <p className="font-medium">{exp.description}</p>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  <span>{exp.branchName}</span>
                  <span>•</span>
                  <span>{exp.category}</span>
                  <span>•</span>
                  <span>By {exp.submittedByName}</span>
                  <span>•</span>
                  {/* createdAt is ISO string after adding write-dates-as-timestamps: false */}
                  <span>{new Date(exp.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold whitespace-nowrap">
                  KES {exp.amount.toLocaleString()}
                </p>
                {exp.status === "PENDING" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setDetailModal(exp)}
                  >
                    <FileText className="h-3 w-3" /> Review
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Review / Action modal */}
      <Dialog
        open={!!detailModal}
        onOpenChange={() => {
          setDetailModal(null);
          setComment("");
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Expense — #{detailModal?.id}</DialogTitle>
            <DialogDescription>
              Review the expense details and decide whether to approve or reject the submission.
            </DialogDescription>
          </DialogHeader>
          {detailModal && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-muted-foreground">Amount</span>
                  <p className="font-bold text-lg">
                    KES {detailModal.amount.toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Category</span>
                  <p className="font-medium">{detailModal.category}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Branch</span>
                  <p className="font-medium">{detailModal.branchName}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Submitted By</span>
                  <p className="font-medium">{detailModal.submittedByName}</p>
                </div>
              </div>

              <div className="text-sm">
                <span className="text-muted-foreground">Description</span>
                <p className="mt-0.5">{detailModal.description}</p>
              </div>

              <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground mb-1">Audit Trail</p>
                <div className="flex items-center gap-2">
                  <Clock className="h-3 w-3" />
                  <span>
                    Submitted on{" "}
                    {new Date(detailModal.createdAt).toLocaleDateString()} by{" "}
                    {detailModal.submittedByName}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  Comment (optional)
                </label>
                <Textarea
                  placeholder="Add a note about this approval decision..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                />
              </div>

              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setDetailModal(null);
                    setComment("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={actionLoading}
                  onClick={() => handleAction(detailModal.id, "REJECTED")}
                >
                  <XCircle className="h-4 w-4" /> Reject
                </Button>
                <Button
                  disabled={actionLoading}
                  onClick={() => handleAction(detailModal.id, "APPROVED")}
                >
                  <CheckCircle2 className="h-4 w-4" /> Approve
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}