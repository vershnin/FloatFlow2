import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from "recharts";
import { getSummaryReport, ReportSummary } from "@/api/reportService";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileDown, FileSpreadsheet, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

const COLORS = ["hsl(224,76%,33%)", "hsl(160,84%,39%)", "hsl(38,92%,50%)", "hsl(224,76%,48%)", "hsl(160,60%,50%)", "hsl(220,14%,70%)"];

export default function ReportsPage() {
  const [period, setPeriod] = useState("6m");
  const [reportData, setReportData] = useState<ReportSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getSummaryReport(period);
        setReportData(data);
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to load report data");
        toast.error("Failed to load report data");
      } finally {
        setIsLoading(false);
      }
    };

    fetchReportData();
  }, [period]);

  const handleExport = (format: string) => {
    toast.success(`Exporting ${format.toUpperCase()} report...`, { description: "Your download will begin shortly" });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading reports...</span>
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error || "Failed to load report data"}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Reports & Analytics" description="Financial insights and performance metrics">
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1m">Last Month</SelectItem>
            <SelectItem value="3m">Last 3 Months</SelectItem>
            <SelectItem value="6m">Last 6 Months</SelectItem>
            <SelectItem value="1y">Last Year</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => handleExport("pdf")}>
          <FileDown className="h-4 w-4" /> PDF
        </Button>
        <Button variant="outline" onClick={() => handleExport("excel")}>
          <FileSpreadsheet className="h-4 w-4" /> Excel
        </Button>
      </PageHeader>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Expenses", value: `KES ${reportData.totalExpenses.toLocaleString()}` },
          { label: "Total Float Allocated", value: `KES ${reportData.totalFloatAllocated.toLocaleString()}` },
          { label: "Approval Rate", value: `${(reportData.approvalRate * 100).toFixed(1)}%` },
          { label: "Avg Processing Time", value: `${reportData.averageProcessingTime.toFixed(1)} days` },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <p className="text-sm text-muted-foreground">{s.label}</p>
            <p className="text-2xl font-bold mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Expense Summary Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold mb-4">Expense Summary Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={reportData.monthlyExpenseTrend}>
              <XAxis dataKey="month" tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="submitted" stroke="hsl(224,76%,33%)" strokeWidth={2} dot={{ r: 4 }} name="Submitted" />
              <Line type="monotone" dataKey="approved" stroke="hsl(160,84%,39%)" strokeWidth={2} dot={{ r: 4 }} name="Approved" />
              <Line type="monotone" dataKey="rejected" stroke="hsl(0,72%,51%)" strokeWidth={2} dot={{ r: 4 }} name="Rejected" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Float Usage</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={reportData.floatUsage} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4}>
                <Cell fill="hsl(224,76%,33%)" />
                <Cell fill="hsl(160,84%,39%)" />
              </Pie>
              <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {reportData.floatUsage.map((item, i) => (
              <div key={item.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: i === 0 ? "hsl(224,76%,33%)" : "hsl(160,84%,39%)" }} />
                <span className="text-muted-foreground">{item.name}: KES {item.value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Branch Comparison & Category */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Branch Comparison</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={reportData.branchComparison} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v / 1000}K`} />
              <YAxis type="category" dataKey="branch" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} width={90} />
              <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
              <Legend />
              <Bar dataKey="float" fill="hsl(224,76%,33%)" radius={[0, 4, 4, 0]} name="Float" barSize={14} />
              <Bar dataKey="expenses" fill="hsl(160,84%,39%)" radius={[0, 4, 4, 0]} name="Expenses" barSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Expense by Category</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={reportData.categoryBreakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} paddingAngle={3}>
                {reportData.categoryBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="grid grid-cols-2 gap-1 mt-2">
            {reportData.categoryBreakdown.map((c, i) => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground truncate">{c.name} ({c.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
