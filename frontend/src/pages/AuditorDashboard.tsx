import { useState, useEffect, useMemo } from "react";
import { Eye, AlertTriangle, Download, Loader2 } from "lucide-react";
import { getAuditLogs, type AuditLogResponse } from "@/api/auditService";
import { getUsers } from "@/api/adminService";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function AuditorDashboard() {
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const logsRes = await getAuditLogs({ size: 50 });
        const usersRes = await getUsers();
        setAuditLogs(Array.isArray(logsRes) ? logsRes : logsRes.content || []);
        setUsers(usersRes);
      } catch (err) {
        toast.error("Failed to load audit data");
        setError("Failed to load audit data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const systemStats = useMemo(() => [
    { title: "Total Transactions", value: auditLogs.length.toString() },
    { title: "Flagged Items", value: auditLogs.filter(log => log.severity === "WARNING" || log.severity === "CRITICAL").length.toString() },
    { title: "Active Users", value: users.filter(u => u.isActive).length.toString() },
    { title: "Audit Period", value: auditLogs.length > 0 ? `${Math.round((new Date().getTime() - new Date(auditLogs[0].createdAt).getTime()) / (1000 * 60 * 60 * 24))} days` : "—" },
  ], [auditLogs, users]);

  const recentLogs = useMemo(() => 
    auditLogs.slice(0, 10).map(log => ({
      timestamp: new Date(log.createdAt).toLocaleString(),
      user: log.userEmail,
      action: log.action,
      detail: log.details || "N/A",
      severity: log.severity.toLowerCase()
    }))
  , [auditLogs]);

  if (loading) {
    return (
      <div>
        <PageHeader title="Audit Dashboard" description="Read-only system overview and audit trail">
          <Button disabled className="gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading...
          </Button>
        </PageHeader>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full glass-card p-5" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <PageHeader title="Audit Dashboard" description="Read-only system overview and audit trail">
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </PageHeader>
        <div className="glass-card p-8 text-center text-destructive">
          Error loading audit data. Please refresh.
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Audit Dashboard" description="Read-only system overview and audit trail">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export Audit Report
        </Button>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {systemStats.map((s, i) => (
          <motion.div 
            key={s.title} 
            initial={{ opacity: 0, y: 12 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.05 }} 
            className="glass-card p-5"
          >
            <span className="text-sm text-muted-foreground">{s.title}</span>
            <div className="text-2xl font-bold mt-1">{s.value}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass-card">
        <div className="flex items-center justify-between p-5 pb-3">
          <h3 className="text-sm font-semibold">Recent Audit Logs</h3>
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
                  <td className="px-5 py-3 text-muted-foreground max-w-xs truncate">{log.detail}</td>
                  <td className="px-5 py-3">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
                      log.severity === "warning" || log.severity === "critical" 
                        ? "bg-warning text-warning-foreground" 
                        : "bg-muted text-muted-foreground"
                    )}>
                      {["warning", "critical"].includes(log.severity) && <AlertTriangle className="h-3 w-3" />}
                      {log.severity}
                    </span>
                  </td>
                </tr>
              ))}
              {recentLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                    No audit logs found
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
