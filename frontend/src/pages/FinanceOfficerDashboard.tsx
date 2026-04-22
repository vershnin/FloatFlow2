import { useState, useEffect, useMemo } from "react";
import { Wallet, TrendingUp, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { getSummaryReport, type BranchReport } from "@/api/reportService";
import { getExpenses } from "@/api/expenseService";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";

const icons = [Wallet, TrendingUp, AlertTriangle, Clock];

interface KpiCard {
  title: string;
  value: string;
  change: string;
  trend: "up" | "down";
}

export default function FinanceOfficerDashboard() {
  const [summaryReports, setSummaryReports] = useState<BranchReport[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [reports, expData] = await Promise.all([
          getSummaryReport(),
          getExpenses({ size: 50 })
        ]);
        setSummaryReports(reports);
        setExpenses(expData);
      } catch (err) {
        toast.error("Failed to load finance dashboard");
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const totalFloat = useMemo(() => 
    summaryReports.reduce((sum, r) => sum + r.totalFloatAllocated, 0), 
    [summaryReports]
  );
  const pendingCount = useMemo(() => 
    summaryReports.reduce((sum, r) => sum + r.pendingExpensesCount, 0), 
    [summaryReports]
  );
  const totalExpensesAmount = useMemo(() => 
    summaryReports.reduce((sum, r) => sum + r.totalExpensesApproved, 0), 
    [summaryReports]
  );
  const utilizationRate = useMemo(() => 
    Math.round((totalExpensesAmount / Math.max(totalFloat, 1)) * 100), 
    [totalExpensesAmount, totalFloat]
  );

  const kpis: KpiCard[] = [
    { title: "Total Float Allocated", value: `KES ${totalFloat.toLocaleString() || 0}`, change: "+12.5%", trend: "up" },
    { title: "Pending Approvals", value: pendingCount.toString() || "0", change: "-3", trend: "down" },
    { title: "Monthly Expenses", value: `KES ${totalExpensesAmount.toLocaleString() || 0}`, change: "+8.2%", trend: "up" },
    { title: "Utilization Rate", value: `${utilizationRate}%`, change: "+4.2%", trend: "up" },
  ];

  const expenseTrend = useMemo(() => {
    const monthData = expenses.reduce((acc, exp) => {
      const date = new Date(exp.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'];
    return months.map(month => ({ month, amount: monthData[month] || 0 }));
  }, [expenses]);

  const branchPerformance = useMemo(() => 
    summaryReports.map(r => ({
      branch: r.branchName.slice(0, 12),
      allocated: `KES ${r.totalFloatAllocated.toLocaleString()}`,
      used: `KES ${r.totalExpensesApproved.toLocaleString()}`,
      utilization: Math.round((r.totalExpensesApproved / Math.max(r.totalFloatAllocated, 1)) * 100)
    }))
  , [summaryReports]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Finance Dashboard" description="Float allocation and expense overview" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full glass-card p-5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Finance Dashboard" description="Float allocation and expense overview" />
        <div className="glass-card p-8 text-center text-destructive">
          Error loading finance data. Please refresh.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Finance Dashboard" description="Float allocation and expense overview" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpis.map((card, i) => {
          const Icon = icons[i];
          return (
            <motion.div key={card.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center gap-1 mt-1 text-xs">
                {card.trend === "up" ? <ArrowUpRight className="h-3 w-3 text-success" /> : <ArrowDownRight className="h-3 w-3 text-destructive" />}
                <span className={card.trend === "up" ? "text-success" : "text-destructive"}>{card.change}</span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="glass-card p-5 mb-6">
        <h3 className="text-sm font-semibold mb-4">Expense Trends</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={expenseTrend}>
            <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
            <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Expenses"]} />
            <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="hsl(160,84%,39%)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="glass-card">
        <div className="p-5 pb-3">
          <h3 className="text-sm font-semibold">Branch Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-5 py-2 font-medium">Branch</th>
                <th className="px-5 py-2 font-medium">Allocated</th>
                <th className="px-5 py-2 font-medium">Used</th>
                <th className="px-5 py-2 font-medium">Utilization</th>
              </tr>
            </thead>
            <tbody>
              {branchPerformance.map((b) => (
                <tr key={b.branch} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-medium">{b.branch}</td>
                  <td className="px-5 py-3 text-muted-foreground">{b.allocated}</td>
                  <td className="px-5 py-3 font-medium">{b.used}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={b.utilization} className="h-2 w-20 flex-shrink-0" />
                      <span className={`text-xs font-medium ${
                        b.utilization > 90 ? "text-destructive" : 
                        b.utilization > 75 ? "text-warning" : "text-success"
                      }`}>
                        {b.utilization}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {branchPerformance.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-8 text-center text-muted-foreground">
                    No branch data available
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
