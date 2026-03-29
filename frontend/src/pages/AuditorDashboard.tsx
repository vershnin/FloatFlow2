import { Eye, AlertTriangle, Download } from "lucide-react";
import { auditorData } from "@/mockData/roles";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function AuditorDashboard() {
  const { systemStats, recentLogs } = auditorData;

  return (
    <div>
      <PageHeader title="Audit Dashboard" description="Read-only system overview and audit trail">
        <Button variant="outline"><Download className="h-4 w-4 mr-1" /> Export Audit Report</Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {systemStats.map((s, i) => (
          <motion.div key={s.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <span className="text-sm text-muted-foreground">{s.title}</span>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card mb-6">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-sm font-semibold">Audit Log</h3>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Eye className="h-3 w-3" /> Read-only
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-5 py-2 font-medium">Timestamp</th>
                <th className="px-5 py-2 font-medium">User</th>
                <th className="px-5 py-2 font-medium">Action</th>
                <th className="px-5 py-2 font-medium">Details</th>
                <th className="px-5 py-2 font-medium">Severity</th>
              </tr>
            </thead>
            <tbody>
              {recentLogs.map((log, i) => (
                <tr key={i} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                  <td className="px-5 py-3 text-muted-foreground font-mono text-xs">{log.timestamp}</td>
                  <td className="px-5 py-3 font-medium">{log.user}</td>
                  <td className="px-5 py-3">{log.action}</td>
                  <td className="px-5 py-3 text-muted-foreground">{log.detail}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                      log.severity === "warning" ? "bg-warning/10 text-warning" : "bg-muted text-muted-foreground"
                    )}>
                      {log.severity === "warning" && <AlertTriangle className="h-3 w-3" />}
                      {log.severity}
                    </span>
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
