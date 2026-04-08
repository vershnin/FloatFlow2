import { useEffect, useMemo, useState } from "react";
import {
  downloadSummaryReportCsv,
  downloadSummaryReportPdf,
  getBranchReport,
  getSummaryReport,
  type BranchReport,
} from "@/api/reportService";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Download, FileText, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export default function ReportsPage() {
  const { user } = useAuth();
  const [summaryData, setSummaryData] = useState<BranchReport[]>([]);
  const [selectedBranchId, setSelectedBranchId] = useState<string>("");
  const [branchReport, setBranchReport] = useState<BranchReport | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSummaryData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getSummaryReport();
        setSummaryData(data);
        const preferredBranchId = user?.branchId ? String(user.branchId) : String(data[0]?.branchId ?? "");
        setSelectedBranchId((current) => current || preferredBranchId);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load report data");
        toast.error("Failed to load report data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummaryData();
  }, [user?.branchId]);

  useEffect(() => {
    if (!selectedBranchId) {
      setBranchReport(null);
      return;
    }

    const fetchBranchReport = async () => {
      try {
        const data = await getBranchReport(Number(selectedBranchId));
        setBranchReport(data);
      } catch (err: any) {
        toast.error(err.response?.data?.message || "Failed to load branch report");
      }
    };

    void fetchBranchReport();
  }, [selectedBranchId]);

  const totals = useMemo(() => {
    return summaryData.reduce(
      (acc, branch) => {
        acc.totalFloatAllocated += branch.totalFloatAllocated;
        acc.totalExpensesApproved += branch.totalExpensesApproved;
        acc.remainingFloat += branch.remainingFloat;
        acc.pendingExpensesCount += branch.pendingExpensesCount;
        acc.approvedExpensesCount += branch.approvedExpensesCount;
        acc.rejectedExpensesCount += branch.rejectedExpensesCount;
        return acc;
      },
      {
        totalFloatAllocated: 0,
        totalExpensesApproved: 0,
        remainingFloat: 0,
        pendingExpensesCount: 0,
        approvedExpensesCount: 0,
        rejectedExpensesCount: 0,
      }
    );
  }, [summaryData]);

  const handleCsvExport = () => {
    if (summaryData.length === 0) {
      toast.error("No report data to export");
      return;
    }
    void downloadSummaryReportCsv(branchReport?.branchId)
      .then(() => toast.success("CSV export started"))
      .catch((err: any) => {
        toast.error(err?.response?.data?.message || "Failed to export CSV report");
      });
  };

  const handlePdfExport = () => {
    if (summaryData.length === 0) {
      toast.error("No report data to export");
      return;
    }
    void downloadSummaryReportPdf(branchReport?.branchId)
      .then(() => toast.success("PDF export started"))
      .catch((err: any) => {
        toast.error(err?.response?.data?.message || "Failed to export PDF report");
      });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports" description="Branch-level float allocation and approval totals">
        <div className="flex flex-wrap items-center gap-2">
          <Select value={selectedBranchId} onValueChange={setSelectedBranchId}>
            <SelectTrigger className="w-56"><SelectValue placeholder="Select branch" /></SelectTrigger>
            <SelectContent>
              {summaryData.map((branch) => (
                <SelectItem key={branch.branchId} value={String(branch.branchId)}>{branch.branchName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleCsvExport}>
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={handlePdfExport}>
            <FileText className="h-4 w-4" /> Export PDF
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Branches", value: summaryData.length.toString() },
          { label: "Total Float Allocated", value: `KES ${totals.totalFloatAllocated.toLocaleString()}` },
          { label: "Approved Expenses", value: `KES ${totals.totalExpensesApproved.toLocaleString()}` },
          { label: "Remaining Float", value: `KES ${totals.remainingFloat.toLocaleString()}` },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Summary By Branch</h3>
          <div className="space-y-3">
            {summaryData.map((branch, index) => (
              <motion.button
                key={branch.branchId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                type="button"
                onClick={() => setSelectedBranchId(String(branch.branchId))}
                className="w-full rounded-lg border p-4 text-left hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold">{branch.branchName}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Pending {branch.pendingExpensesCount} • Approved {branch.approvedExpensesCount} • Rejected {branch.rejectedExpensesCount}
                    </p>
                  </div>
                  <div className="text-right text-sm">
                    <p className="font-medium">KES {branch.remainingFloat.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Remaining float</p>
                  </div>
                </div>
              </motion.button>
            ))}
            {summaryData.length === 0 && (
              <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
                No branch report data available.
              </div>
            )}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Selected Branch Detail</h3>
          {branchReport ? (
            <div className="space-y-4">
              <div>
                <p className="text-lg font-bold">{branchReport.branchName}</p>
                <p className="text-sm text-muted-foreground">Current branch report response from backend</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground">Allocated Float</p>
                  <p className="mt-1 font-semibold">KES {branchReport.totalFloatAllocated.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground">Approved Expenses</p>
                  <p className="mt-1 font-semibold">KES {branchReport.totalExpensesApproved.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground">Remaining Float</p>
                  <p className="mt-1 font-semibold">KES {branchReport.remainingFloat.toLocaleString()}</p>
                </div>
                <div className="rounded-lg bg-muted/50 p-3">
                  <p className="text-muted-foreground">Total Decisions</p>
                  <p className="mt-1 font-semibold">{branchReport.approvedExpensesCount + branchReport.rejectedExpensesCount}</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="mt-1 text-xl font-bold">{branchReport.pendingExpensesCount}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Approved</p>
                  <p className="mt-1 text-xl font-bold">{branchReport.approvedExpensesCount}</p>
                </div>
                <div className="rounded-lg border p-3">
                  <p className="text-xs text-muted-foreground">Rejected</p>
                  <p className="mt-1 text-xl font-bold">{branchReport.rejectedExpensesCount}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
              Select a branch to view report details.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
