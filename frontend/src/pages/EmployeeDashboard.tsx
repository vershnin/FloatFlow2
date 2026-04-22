import { useState, useEffect, useMemo } from "react";
import { Plus, CheckCircle2, Clock, XCircle, Loader2 } from "lucide-react";
import { getMyExpenses, type ExpenseResponse } from "@/api/expenseService";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function EmployeeDashboard() {
  const [myExpenses, setMyExpenses] = useState<ExpenseResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExpenses = async () => {
      try {
        setLoading(true);
        setError(null);
        const expenses = await getMyExpenses({ size: 20 });
        setMyExpenses(expenses);
      } catch (err) {
        toast.error("Failed to load your expenses");
        setError("Failed to load expenses");
      } finally {
        setLoading(false);
      }
    };
    fetchExpenses();
  }, []);

  const stats = useMemo(() => {
    const total = myExpenses.length;
    const approved = myExpenses.filter(e => e.status === "APPROVED").length;
    const pending = myExpenses.filter(e => e.status === "PENDING").length;
    const rejected = myExpenses.filter(e => e.status === "REJECTED").length;
    return { total, approved, pending, rejected };
  }, [myExpenses]);

  const statCards = [
    { label: "Total Submitted", value: stats.total.toString(), icon: Plus, color: "text-primary" },
    { label: "Approved", value: stats.approved.toString(), icon: CheckCircle2, color: "text-success" },
    { label: "Pending", value: stats.pending.toString(), icon: Clock, color: "text-warning" },
    { label: "Rejected", value: stats.rejected.toString(), icon: XCircle, color: "text-destructive" },
  ];

  if (loading) {
    return (
      <div>
        <PageHeader title="My Dashboard" description="Submit and track your expenses">
          <Button disabled className="gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </PageHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="My Dashboard" description="Submit and track your expenses">
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </PageHeader>
        <div className="glass-card p-8 text-center text-destructive">
          Error loading expenses
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="My Dashboard" description="Submit and track your expenses">
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Submit Expense
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <motion.div 
            key={s.label} 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }} 
            className="glass-card p-5 text-center"
          >
            <s.icon className={`h-5 w-5 mx-auto mb-2 ${s.color}`} />
            <div className="text-2xl font-bold">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-sm font-semibold">My Expense History</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-5 py-2 font-medium">ID</th>
                <th className="px-5 py-2 font-medium">Description</th>
                <th className="px-5 py-2 font-medium">Amount</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {myExpenses.map((exp) => (
                <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-primary">EXP-{exp.id}</td>
                  <td className="px-5 py-3 max-w-xs truncate">{exp.description}</td>
                  <td className="px-5 py-3 font-medium">KES {exp.amount.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={exp.status} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">
                    {new Date(exp.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {myExpenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No expenses submitted yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
