import { Wallet, TrendingUp, AlertTriangle, Clock, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { financeOfficerData } from "@/mockData/roles";
import { PageHeader } from "@/components/PageHeader";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

const icons = [Wallet, TrendingUp, AlertTriangle, Clock];

export default function FinanceOfficerDashboard() {
  const { kpis, expenseTrend, branchPerformance } = financeOfficerData;

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
            <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
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
                  <td className="px-5 py-3">{b.used}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Progress value={b.utilization} className="h-2 w-20" />
                      <span className={`text-xs font-medium ${b.utilization > 90 ? "text-destructive" : b.utilization > 75 ? "text-warning" : "text-success"}`}>
                        {b.utilization}%
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
