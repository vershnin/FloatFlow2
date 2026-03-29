import { Wallet, Receipt, Clock, PieChart as PieChartIcon, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { branchManagerData } from "@/mockData/roles";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

const icons = [Wallet, Receipt, Clock, PieChartIcon];

export default function BranchManagerDashboard() {
  const { kpis, recentExpenses, monthlyUsage } = branchManagerData;

  return (
    <div>
      <PageHeader title="Branch Dashboard" description="Nairobi CBD branch overview">
        <Button>New Expense</Button>
      </PageHeader>

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
              </div>
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
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
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
            {recentExpenses.filter(e => e.status === "pending").map((exp) => (
              <div key={exp.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{exp.description}</p>
                  <p className="text-xs text-muted-foreground">{exp.id} · {exp.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">{exp.amount}</p>
                  <div className="flex gap-1 mt-1">
                    <Button size="sm" variant="outline" className="h-6 text-xs px-2">Reject</Button>
                    <Button size="sm" className="h-6 text-xs px-2">Approve</Button>
                  </div>
                </div>
              </div>
            ))}
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
              {recentExpenses.map((exp) => (
                <tr key={exp.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 font-medium text-primary">{exp.id}</td>
                  <td className="px-5 py-3">{exp.description}</td>
                  <td className="px-5 py-3 font-medium">{exp.amount}</td>
                  <td className="px-5 py-3"><StatusBadge status={exp.status} /></td>
                  <td className="px-5 py-3 text-muted-foreground">{exp.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
