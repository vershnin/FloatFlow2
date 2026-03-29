import { useState } from "react";
import { Search, Download, Eye, AlertTriangle, ShieldAlert } from "lucide-react";
import { auditLogs } from "@/mockData/enterprise";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const severityStyles: Record<string, string> = {
  info: "bg-muted text-muted-foreground",
  warning: "bg-warning/10 text-warning",
  critical: "bg-destructive/10 text-destructive",
};

export default function AuditLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [userFilter, setUserFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");

  const users = [...new Set(auditLogs.map((l) => l.user))];

  const filtered = auditLogs.filter((log) => {
    if (userFilter !== "all" && log.user !== userFilter) return false;
    if (severityFilter !== "all" && log.severity !== severityFilter) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return log.action.toLowerCase().includes(q) || log.details.toLowerCase().includes(q) || log.entityId.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div>
      <PageHeader title="Audit Logs" description="System activity and audit trail">
        <div className="flex items-center gap-1 text-xs text-muted-foreground border rounded-lg px-2 py-1">
          <Eye className="h-3 w-3" /> Read-only
        </div>
        <Button variant="outline" onClick={() => toast.success("Exporting audit log CSV...")}>
          <Download className="h-4 w-4 mr-1" /> Export CSV
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search actions, details..." className="pl-9" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
        <Select value={userFilter} onValueChange={setUserFilter}>
          <SelectTrigger className="w-44"><SelectValue placeholder="User" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={severityFilter} onValueChange={setSeverityFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Log Table */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">Timestamp</th>
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Action</th>
                <th className="px-5 py-3 font-medium">Entity</th>
                <th className="px-5 py-3 font-medium">Details</th>
                <th className="px-5 py-3 font-medium">Severity</th>
                <th className="px-5 py-3 font-medium">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No audit entries found</td></tr>
              ) : (
                filtered.map((log) => (
                  <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{log.timestamp}</td>
                    <td className="px-5 py-3 font-medium">{log.user}</td>
                    <td className="px-5 py-3">{log.action}</td>
                    <td className="px-5 py-3">
                      <span className="text-primary font-medium">{log.entityId}</span>
                      <span className="text-muted-foreground ml-1 text-xs">({log.entity})</span>
                    </td>
                    <td className="px-5 py-3 text-muted-foreground max-w-[250px] truncate">{log.details}</td>
                    <td className="px-5 py-3">
                      <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize", severityStyles[log.severity])}>
                        {log.severity === "warning" && <AlertTriangle className="h-3 w-3" />}
                        {log.severity === "critical" && <ShieldAlert className="h-3 w-3" />}
                        {log.severity}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{log.ipAddress}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground">
          Showing {filtered.length} of {auditLogs.length} entries
        </div>
      </motion.div>
    </div>
  );
}
