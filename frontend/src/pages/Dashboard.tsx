import { Wallet, Clock, TrendingUp, Building2, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from "recharts";
import { kpiCards, recentTransactions, monthlySpendData, branchAllocation } from "@/mockData/dashboard";
import { StatusBadge } from "@/components/StatusBadge";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const iconMap: Record<string, React.ElementType> = { Wallet, Clock, TrendingUp, Building2 };
const pieColors = ["hsl(224,76%,33%)", "hsl(160,84%,39%)", "hsl(38,92%,50%)", "hsl(224,76%,48%)", "hsl(160,60%,50%)", "hsl(220,14%,80%)"];

export default function Dashboard() {
  return (
    <div>
      <PageHeader title="Dashboard" description="Overview of your float and petty cash operations">
        <Button>Allocate Float</Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {kpiCards.map((card, i) => {
          const Icon = iconMap[card.icon];
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
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
              <Tooltip formatter={(v: number) => [`KES ${v.toLocaleString()}`, "Spend"]} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]} fill="hsl(224,76%,33%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Branch Allocation</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={branchAllocation} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {branchAllocation.map((_, i) => (
                  <Cell key={i} fill={pieColors[i]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {branchAllocation.map((b, i) => (
              <div key={b.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: pieColors[i] }} />
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
          <Button variant="ghost" size="sm" className="text-xs text-primary">View All</Button>
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
                  <td className="px-5 py-3"><StatusBadge status={tx.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{tx.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
