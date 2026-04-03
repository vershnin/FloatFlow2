import { Plus, CheckCircle2, Clock, XCircle } from "lucide-react";
import { employeeData } from "@/mockData/roles";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function EmployeeDashboard() {
  const { myExpenses, stats } = employeeData;

  const statCards = [
    { label: "Total Submitted", value: stats.total, icon: Plus, color: "text-primary" },
    { label: "Approved", value: stats.approved, icon: CheckCircle2, color: "text-success" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
    { label: "Rejected", value: stats.rejected, icon: XCircle, color: "text-destructive" },
  ];

  return (
    <div>
      <PageHeader title="My Dashboard" description="Submit and track your expenses">
        <Button><Plus className="h-4 w-4" /> Submit Expense</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5 text-center">
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
