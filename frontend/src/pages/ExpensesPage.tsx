import { useState, useEffect, useMemo } from "react";
import { Search, Plus } from "lucide-react";
import { getExpenses, getMyExpenses, submitDraftExpense, type ExpenseResponse } from "@/api/expenseService";
import { useAuth } from "@/context/AuthContext";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SubmitExpenseModal } from "@/components/SubmitExpenseModal";
import { motion } from "framer-motion";
import { debounce } from "@/lib/performance";
import { toast } from "sonner";

export default function ExpensesPage() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);

  const debouncedSetSearch = useMemo(
    () => debounce((query: string) => setDebouncedSearchQuery(query), 300),
    []
  );

  useEffect(() => {
    debouncedSetSearch(searchQuery);
  }, [searchQuery, debouncedSetSearch]);

  const canSeeAll = user?.role === "FINANCE_OFFICER" ||
                    user?.role === "ADMIN";

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = canSeeAll ? await getExpenses() : await getMyExpenses();
      setExpenses(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, []);

  const handleDraftSubmit = async (expenseId: number) => {
    try {
      await submitDraftExpense(expenseId);
      toast.success("Draft submitted for approval");
      await loadExpenses();
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to submit draft");
    }
  };

  const filtered = expenses.filter((exp) => {
    if (statusFilter !== "all" && exp.status !== statusFilter) return false;
    if (debouncedSearchQuery) {
      const q = debouncedSearchQuery.toLowerCase();
      return (
        String(exp.id).includes(q) ||
        exp.description.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q) ||
        exp.submittedByName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const statuses = ["all", "DRAFT", "PENDING", "APPROVED", "REJECTED", "WITHDRAWN"] as const;

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading expenses...</div>;
  }

  return (
    <div>
      <PageHeader
        title="Expenses"
        description={canSeeAll ? "All branch expenses" : "Your submitted expenses"}
      >
        <Button onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" /> Submit Expense
        </Button>
      </PageHeader>

      <div className="flex flex-wrap gap-2 mb-4">
        {statuses.map((s) => (
          <Button
            key={s}
            onClick={() => setStatusFilter(s)}
            variant={statusFilter === s ? "default" : "secondary"}
            size="sm"
            className="capitalize"
            aria-label={`Filter by ${s.toLowerCase()} expenses`}
            aria-pressed={statusFilter === s}
          >
            {s.toLowerCase()} ({s === "all" ? expenses.length : expenses.filter((e) => e.status === s).length})
          </Button>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search expenses..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">ID</th>
                <th className="px-5 py-3 font-medium">Description</th>
                <th className="px-5 py-3 font-medium">Category</th>
                <th className="px-5 py-3 font-medium">Branch</th>
                <th className="px-5 py-3 font-medium">Amount</th>
                <th className="px-5 py-3 font-medium">Submitted By</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Date</th>
                <th className="px-5 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-12 text-center text-muted-foreground">No expenses found</td></tr>
              ) : (
                filtered.map((exp) => (
                  <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-primary">#{exp.id}</td>
                    <td className="px-5 py-3 max-w-[200px] truncate">{exp.description}</td>
                    <td className="px-5 py-3 text-muted-foreground">{exp.category}</td>
                    <td className="px-5 py-3">{exp.branchName}</td>
                    <td className="px-5 py-3 font-medium">KES {Number(exp.amount).toLocaleString()}</td>
                    <td className="px-5 py-3 text-muted-foreground">{exp.submittedByName}</td>
                    <td className="px-5 py-3"><StatusBadge status={exp.status.toLowerCase()} /></td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {exp.createdAt ? new Date(exp.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-5 py-3">
                      {exp.status === "DRAFT" ? (
                        <Button size="sm" variant="outline" onClick={() => void handleDraftSubmit(exp.id)}>
                          Submit Draft
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      <SubmitExpenseModal open={modalOpen} onClose={() => { setModalOpen(false); loadExpenses(); }} />
    </div>
  );
}