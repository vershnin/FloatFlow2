import { useState, useEffect, useMemo } from "react";
import { Download, Eye, AlertTriangle, ShieldAlert, Loader2 } from "lucide-react";
import { getAuditLogs, type AuditLogResponse, type AuditLogPageResponse } from "@/api/auditService";
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
  const [auditLogs, setAuditLogs] = useState<AuditLogResponse[]>([]);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [entityFilter, setEntityFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const loadAuditLogs = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const params: any = {
          page: page - 1, // 0-based
          size: pageSize,
        };
        
        if (entityFilter !== "all") params.entityType = entityFilter;
        if (severityFilter !== "all") params.severity = severityFilter.toUpperCase();
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;
        
        const response: AuditLogPageResponse = await getAuditLogs(params);
        setAuditLogs(response.content);
        setTotalElements(response.totalElements);
        setTotalPages(response.totalPages);
      } catch (error: any) {
        setLoadError(error?.response?.data?.message || "Failed to load audit logs");
        toast.error("Failed to load audit logs");
      } finally {
        setIsLoading(false);
      }
    };
    loadAuditLogs();
  }, [page, pageSize, entityFilter, severityFilter, dateFrom, dateTo]);

  const users = useMemo(() => [...new Set(auditLogs.map((l) => l.userName || "Unknown"))], [auditLogs]);
  const entities = useMemo(() => [...new Set(auditLogs.map((l) => l.entityType || "Unknown"))], [auditLogs]);

  // Remove client-side filtering since we're using server-side pagination
  const filtered = auditLogs;
  const currentPage = page;
  const paginated = auditLogs;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span>Loading audit logs...</span>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{loadError}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Audit Logs" description="System activity and audit trail">
        <div className="flex items-center gap-1 text-xs text-muted-foreground border rounded-lg px-2 py-1">
          <Eye className="h-3 w-3" /> Read-only
        </div>
        <Button variant="outline" onClick={() => toast.success("Exporting audit log CSV...")}>
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={entityFilter} onValueChange={(v) => { setEntityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue placeholder="Entity Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entities</SelectItem>
            {entities.map((e) => <SelectItem key={e} value={e}>{e}</SelectItem>)}
          </SelectContent>
        </Select>

        <Select value={severityFilter} onValueChange={(v) => { setSeverityFilter(v); setPage(1); }}>
          <SelectTrigger className="w-36"><SelectValue placeholder="Severity" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severity</SelectItem>
            <SelectItem value="info">Info</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-2">
          <Input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="w-36" placeholder="From" />
          <Input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="w-36" placeholder="To" />
        </div>
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
              {paginated.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-12 text-center text-muted-foreground">No audit entries found</td></tr>
              ) : (
                paginated.map((log) => {
                  const severityKey = (log.severity || "").toLowerCase();
                  const timestamp = log.createdAt || (log as any).timestamp || "-";
                  return (
                    <tr key={log.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{timestamp}</td>
                      <td className="px-5 py-3 font-medium">{log.userName || "Unknown"}</td>
                      <td className="px-5 py-3">{log.action}</td>
                      <td className="px-5 py-3">
                        <span className="text-primary font-medium">{log.entityId}</span>
                        <span className="text-muted-foreground ml-1 text-xs">({log.entityType || "N/A"})</span>
                      </td>
                      <td className="px-5 py-3 text-muted-foreground max-w-[250px] truncate">{log.details || "-"}</td>
                      <td className="px-5 py-3">
                        <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize", severityStyles[severityKey])}>
                          {severityKey === "warning" && <AlertTriangle className="h-3 w-3" />}
                          {severityKey === "critical" && <ShieldAlert className="h-3 w-3" />}
                          {severityKey}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{log.ipAddress || "-"}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t px-5 py-3 text-xs text-muted-foreground flex flex-wrap items-center justify-between gap-3">
          <div>
            Showing {auditLogs.length} of {totalElements} entries
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>Prev</Button>
            <span>Page {page} / {totalPages}</span>
            <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next</Button>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50].map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
