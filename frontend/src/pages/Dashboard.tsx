import { useState, useEffect, useMemo } from "react";
import { Wallet, Clock, TrendingUp, Building2, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { getSummaryReport, type BranchReport } from "@/api/reportService";
import { getExpenses } from "@/api/expenseService";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

const iconMap: Record<string, React.ElementType> = { Wallet, Clock, TrendingUp, Building2 };
const pieColors = ["hsl(224,76%,33%)", "hsl(160,84%,39%)", "hsl(38,92%,50%)", "hsl(224,76%,48%)", "hsl(160,60%,50%)", "hsl(220,14%,80%)"];

export default function Dashboard() {
  const { user } = useAuth();
  const [summaryReports, setSummaryReports] = useState<BranchReport[]>([]);
  const [recentExpenses, setRecentExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        const [reports, expenses] = await Promise.all([
          getSummaryReport(),
          getExpenses({ size: 10 })
        ]);
        setSummaryReports(reports);
        setRecentExpenses(expenses);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load dashboard data");
        setError("Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const totalFloat = useMemo(() => 
    summaryReports.reduce((sum, r) => sum + r.totalFloatAllocated, 0), 
    [summaryReports]
  );
  const totalExpenses = useMemo(() => 
    summaryReports.reduce((sum, r) => sum + r.totalExpensesApproved, 0), 
    [summaryReports]
  );
  const pendingCount = useMemo(() => 
    summaryReports.reduce((sum, r) => sum + r.pendingExpensesCount, 0), 
    [summaryReports]
  );
  const activeBranches = useMemo(() => summaryReports.length, [summaryReports]);

  const kpiCards = [
    { title: "Total Float Allocated", value: `KES ${totalFloat.toLocaleString() || 0}`, change: "+12.5%", trend: "up" as const, icon: "Wallet" },
    { title: "Pending Approvals", value: pendingCount.toString() || "0", change: "-3", trend: "down" as const, icon: "Clock" },
    { title: "Monthly Expenses", value: `KES ${totalExpenses.toLocaleString() || 0}`, change: "+8.2%", trend: "up" as const, icon: "TrendingUp" },
    { title: "Active Branches", value: activeBranches.toString() || "0", change: "+2", trend: "up" as const, icon: "Building2" },
  ];

  const monthlySpendData = useMemo(() => {
    const data = recentExpenses.reduce((acc, exp) => {
      const date = new Date(exp.createdAt);
      const month = date.toLocaleString('default', { month: 'short' });
      acc[month] = (acc[month] || 0) + exp.amount;
      return acc;
    }, {} as Record<string, number>);
    return Object.entries(data).map(([month, amount]) => ({ month, amount })).slice(-7);
  }, [recentExpenses]);

  const branchAllocation = useMemo(() => 
    summaryReports.slice(0, 6).map(r => ({
      name: r.branchName.slice(0, 12),
      value: Math.round((r.totalExpensesApproved / Math.max(r.totalFloatAllocated, 1)) * 100)
    }))
  , [summaryReports]);

  const recentTransactions = useMemo(() => 
    recentExpenses.map(exp => ({
      id: `EXP-${exp.id}`,
      branch: exp.branchName,
      type: exp.category || 'Expense',
      amount: `KES ${exp.amount.toLocaleString()}`,
      status: exp.status.toLowerCase(),
      date: new Date(exp.createdAt).toLocaleDateString()
    }))
  , [recentExpenses]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Dashboard" description="Overview of your float and petty cash operations">
          <Button disabled className="gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </PageHeader>
        {/* KPI Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="glass-card p-5">
              <Skeleton className="h-12 w-24 mb-2" />
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Dashboard" description="Overview of your float and petty cash operations">
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </PageHeader>
        <div className="glass-card p-8 text-center text-destructive">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your float and petty cash operations">
        <Button>Allocate Float</Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card, i) => {
          const Icon = iconMap[card.icon as keyof typeof iconMap];
          return (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-muted-foreground">{card.title}</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </div>
              <div className="text-2xl font-bold">{card.value}</div>
              <div className="flex items-center gap-1 mt-1 text-xs">
                {card.trend === "up" ? (
                  <ArrowUpRight className="h-3 w-3 text-success" />
                ) : (
                  <ArrowDownRight className="h-3 w-3 text-destructive" />
                )}
                <span className={card.trend === "up" ? "text-success" : "text-destructive"}>
                  {card.change}
                </span>
                <span className="text-muted-foreground">vs last month</span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Monthly Spend Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlySpendData}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}` , "Spend"]} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="hsl(224,76%,33%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Branch Allocation</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie 
                data={branchAllocation} 
                dataKey="value" 
                nameKey="name" 
                cx="50%" 
                cy="50%" 
                innerRadius={45} 
                outerRadius={70} 
                paddingAngle={3}
              >
                {branchAllocation.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {branchAllocation.map((b, i) => (
              <div key={b.name} className="flex items-center gap-1.5 text-xs">
                <span 
                  className="h-2 w-2 rounded-full shrink-0" 
                  style={{ backgroundColor: pieColors[i % pieColors.length] }} 
                />
                <span className="text-muted-foreground truncate">{b.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="glass-card">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-sm font-semibold">Recent Transactions</h3>
          <Button variant="ghost" size="sm" className="text-xs text-primary">
            View All
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-5 py-2 font-medium">ID</th>
                <th className="px-5 py-2 font-medium">Branch</th>
                <th className="px-5 py-2 font-medium">Type</th>
                <th className="px-5 py-2 font-medium">Amount</th>
                <th className="px-5 py-2 font-medium">Status</th>
                <th className="px-5 py-2 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-primary">{tx.id}</td>
                  <td className="px-5 py-3">{tx.branch}</td>
                  <td className="px-5 py-3 text-muted-foreground">{tx.type}</td>
                  <td className="px-5 py-3 font-medium">{tx.amount}</td>
                  <td className="px-5 py-3">
                    <StatusBadge status={tx.status as any} />
                  </td>
                  <td className="px-5 py-3 text-muted-foreground">{tx.date}</td>
                </tr>
              ))}
              {recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-muted-foreground text-sm">
                    No recent transactions
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
