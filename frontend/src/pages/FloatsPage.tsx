import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Wallet, ArrowUpCircle, AlertTriangle, XCircle, Plus, RefreshCw } from "lucide-react";
import { getFloats, type FloatResponse } from "@/api/floatService";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { AllocateFloatModal } from "@/components/AllocateFloatModal";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Map backend ACTIVE/EXHAUSTED to display config
const statusConfig: Record<string, { icon: any; color: string; bg: string; label: string }> = {
  ACTIVE:    { icon: Wallet,        color: "text-success",     bg: "bg-success/10",     label: "Active" },
  LOW:       { icon: AlertTriangle, color: "text-warning",     bg: "bg-warning/10",     label: "Low (<20%)" },
  EXHAUSTED: { icon: XCircle,       color: "text-destructive", bg: "bg-destructive/10", label: "Exhausted" },
  CLOSED:    { icon: XCircle,       color: "text-muted-foreground", bg: "bg-muted",     label: "Closed" },
};

// Derive display status from balance percentage
function deriveStatus(float: FloatResponse): string {
  if (float.currentBalance <= 0) return "EXHAUSTED";
  const pct = (float.currentBalance / float.initialAmount) * 100;
  if (pct < 20) return "LOW";
  return "ACTIVE";
}

export default function FloatsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";
  const navigate = useNavigate();
  const [floats, setFloats] = useState<FloatResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"allocate" | "topup">("allocate");
  const [topUpFloatId, setTopUpFloatId] = useState<number | undefined>();

  const loadFloats = async () => {
    setLoading(true);
    try {
      const data = await getFloats();
      setFloats(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadFloats(); }, []);

  const filtered = floats.filter((f) => {
    if (statusFilter === "all") return true;
    return deriveStatus(f) === statusFilter;
  });

  const totalInitial   = floats.reduce((s, f) => s + f.initialAmount, 0);
  const totalRemaining = floats.reduce((s, f) => s + f.currentBalance, 0);
  const totalUsed      = totalInitial - totalRemaining;

  const summaryCards = [
    { title: "Total Allocated",  value: `KES ${totalInitial.toLocaleString()}`,   icon: Wallet,        accent: "bg-primary/10 text-primary" },
    { title: "Total Used",       value: `KES ${totalUsed.toLocaleString()}`,      icon: ArrowUpCircle, accent: "bg-warning/10 text-warning" },
    { title: "Remaining Balance",value: `KES ${totalRemaining.toLocaleString()}`, icon: RefreshCw,     accent: "bg-success/10 text-success" },
  ];

  const openTopUp = (floatId: number) => {
    setModalMode("topup");
    setTopUpFloatId(floatId);
    setModalOpen(true);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64 text-muted-foreground">Loading floats...</div>;
  }

  return (
    <div>
      <PageHeader title="Float Management" description="Allocate and manage float across branches">
        <div className="flex items-center gap-2">
          {isAdmin && (
            <Button variant="outline" onClick={() => navigate("/admin/branches")}>
              <Plus className="h-4 w-4" /> Manage Branches
            </Button>
          )}
          <Button onClick={() => { setModalMode("allocate"); setTopUpFloatId(undefined); setModalOpen(true); }}>
            <Plus className="h-4 w-4" /> Allocate Float
          </Button>
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {summaryCards.map((card, i) => (
          <motion.div key={card.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
            <div className="flex items-center gap-3">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg", card.accent)}>
                <card.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{card.title}</p>
                <p className="text-xl font-bold">{card.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="LOW">Low</SelectItem>
            <SelectItem value="EXHAUSTED">Exhausted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {filtered.map((f) => {
          const pct  = Math.round((f.currentBalance / f.initialAmount) * 100);
          const stat = deriveStatus(f);
          const cfg  = statusConfig[stat] || statusConfig.ACTIVE;
          return (
            <motion.div key={f.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold">{f.branchName}</h3>
                <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", cfg.bg, cfg.color)}>
                  <cfg.icon className="h-3 w-3" /> {cfg.label}
                </span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Initial</span><span className="font-medium">KES {f.initialAmount.toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Used</span><span className="font-medium">KES {(f.initialAmount - f.currentBalance).toLocaleString()}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Remaining</span><span className="font-bold">KES {f.currentBalance.toLocaleString()}</span></div>
                <div className="flex items-center gap-2 pt-1">
                  <Progress value={pct} className="h-2 flex-1" />
                  <span className={cn("text-xs font-medium", pct < 20 ? "text-destructive" : pct < 40 ? "text-warning" : "text-success")}>{pct}%</span>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button size="sm" variant="outline" className="flex-1" aria-label="Top up this float" onClick={() => openTopUp(f.id)}>
                  <ArrowUpCircle className="h-3 w-3" /> Top Up
                </Button>
              </div>
            </motion.div>
          );
        })}
      </div>

      <AllocateFloatModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); loadFloats(); }}
        mode={modalMode}
        floatId={topUpFloatId}
      />
    </div>
  );
}
