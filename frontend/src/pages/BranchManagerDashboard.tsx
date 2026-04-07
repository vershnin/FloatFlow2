import { useState, useEffect, useMemo } from "react";
import { Wallet, Receipt, Clock, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getFloats, type FloatResponse } from "@/api/floatService";
import { getExpenses, getBranchExpenses, type ExpenseResponse } from "@/api/expenseService";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

function weekOfMonth(date: Date): number {
  const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
  return Math.min(Math.ceil((date.getDate() + firstDay.getDay()) / 7), 4);
}

export default function BranchManagerDashboard() {
  const { user } = useAuth();
  const [floats, setFloats] = useState<FloatResponse[]>([]);
  const [expenses, setExpenses] = useState<ExpenseResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const isBranchManager = user?.role === "BRANCH_MANAGER";
        const [floatData, expenseData] = await Promise.all([
          getFloats(),
          isBranchManager ? getBranchExpenses({ size: 50 }) : getExpenses({ size: 50 }),
        ]);
        setFloats(floatData);
        setExpenses(expenseData);
      } catch {
        toast.error("Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.role]);

  const activeFloat = floats.find((f) => f.status === "ACTIVE");
  const pendingExpenses = expenses.filter((e) => e.status === "PENDING");

  const thisWeekAmount = useMemo(() => {
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return expenses
      .filter((e) => new Date(e.createdAt) >= startOfWeek)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const monthlyUsage = useMemo(() => {
    const now = new Date();
    const weeks: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 };
    expenses
      .filter((e) => {
        const d = new Date(e.createdAt);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .forEach((e) => {
        const w = weekOfMonth(new Date(e.createdAt));
        weeks[w] += e.amount;
      });
    return [1, 2, 3, 4].map((w) => ({ week: `Week ${w}`, amount: weeks[w] }));
  }, [expenses]);

  const kpis = [
    {
      title: "Float Balance",
      value: activeFloat ? `KES ${activeFloat.currentBalance.toLocaleString()}` : "—",
      icon: Wallet,
      sub: activeFloat ? `${activeFloat.balancePercentage}% remaining` : "No active float",
    },
    {
      title: "Pending Requests",
      value: pendingExpenses.length.toString(),
      icon: Clock,
      sub: "Awaiting approval",
    },
    {
      title: "This Week Usage",
      value: `KES ${thisWeekAmount.toLocaleString()}`,
      icon: Receipt,
      sub: "Expenses this week",
    },
    {
      title: "Float Utilization",
      value: activeFloat ? `${activeFloat.balancePercentage}%` : "—",
      icon: TrendingUp,
      sub: activeFloat ? `of KES ${activeFloat.initialAmount.toLocaleString()}` : "No active float",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-muted-foreground">
        Loading dashboard…
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Branch Dashboard"
        description={user?.branchName ? `${user.branchName} branch overview` : "Branch overview"}
      >
        <Button>New Expense</Button>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((card, i) => {
          const Icon = card.icon;
          return (
            <motion.div key={card.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <p className="text-xs text-muted-foreground mt-1">{card.sub}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Monthly Usage</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyUsage}>
              <XAxis dataKey="week" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Usage"]} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="hsl(224,76%,33%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card">
          <div className="flex items-center justify-between p-5 pb-3">
            <h3 className="text-sm font-semibold">Pending Approval Requests</h3>
          </div>
          <div className="px-5 pb-5 space-y-3">
            {pendingExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending requests</p>
            ) : (
              pendingExpenses.slice(0, 5).map((exp) => (
                <div key={exp.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">{exp.description}</p>
                    <p className="text-xs text-muted-foreground">
                      EXP-{exp.id} · {new Date(exp.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold">KES {exp.amount.toLocaleString()}</p>
                    <StatusBadge status={exp.status} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="glass-card">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-semibold">Recent Expenses</h3>
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
              {expenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No expenses found
                  </td>
                </tr>
              ) : (
                expenses.slice(0, 10).map((exp) => (
                  <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-medium text-primary">EXP-{exp.id}</td>
                    <td className="px-5 py-3">{exp.description}</td>
                    <td className="px-5 py-3 font-medium">KES {exp.amount.toLocaleString()}</td>
                    <td className="px-5 py-3"><StatusBadge status={exp.status} /></td>
                    <td className="px-5 py-3 text-muted-foreground">
                      {new Date(exp.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
