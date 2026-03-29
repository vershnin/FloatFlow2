import { useState } from "react";
import { Plus, Edit2, ShieldCheck, ShieldOff } from "lucide-react";
import { policies, policyTypes, type Policy } from "@/mockData/policies";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { PolicyModal } from "@/components/PolicyModal";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const typeLabels: Record<string, string> = Object.fromEntries(policyTypes.map((t) => [t.value, t.label]));

export default function PoliciesPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [localPolicies, setLocalPolicies] = useState(policies);

  const handleEdit = (p: Policy) => {
    setEditPolicy(p);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditPolicy(null);
    setModalOpen(true);
  };

  const toggleEnabled = (id: string) => {
    setLocalPolicies((prev) => prev.map((p) => p.id === id ? { ...p, enabled: !p.enabled } : p));
  };

  const enabledCount = localPolicies.filter((p) => p.enabled).length;
  const disabledCount = localPolicies.filter((p) => !p.enabled).length;

  return (
    <div>
      <PageHeader title="Policies" description="Configure spending policies and limits">
        <Button onClick={handleCreate}><Plus className="h-4 w-4 mr-1" /> Create Policy</Button>
      </PageHeader>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Policies</p>
            <p className="text-xl font-bold">{localPolicies.length}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <ShieldCheck className="h-5 w-5 text-success" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-xl font-bold">{enabledCount}</p>
          </div>
        </div>
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <ShieldOff className="h-5 w-5 text-muted-foreground" />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Disabled</p>
            <p className="text-xl font-bold">{disabledCount}</p>
          </div>
        </div>
      </div>

      {/* Policy Cards */}
      <div className="space-y-3">
        {localPolicies.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={cn("glass-card p-5", !p.enabled && "opacity-60")}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold">{p.name}</h3>
                  <span className="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                    {typeLabels[p.type]}
                  </span>
                  {p.category && (
                    <span className="inline-flex items-center rounded-full bg-accent/10 px-2 py-0.5 text-xs font-medium text-accent">
                      {p.category}
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{p.description}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span>Limit: <strong className="text-foreground">KES {p.limit.toLocaleString()}</strong></span>
                  <span>Updated: {p.updatedAt}</span>
                  <span>By: {p.createdBy}</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={p.enabled} onCheckedChange={() => toggleEnabled(p.id)} />
                <Button size="sm" variant="outline" onClick={() => handleEdit(p)}>
                  <Edit2 className="h-3 w-3 mr-1" /> Edit
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <PolicyModal open={modalOpen} onClose={() => setModalOpen(false)} policy={editPolicy} />
    </div>
  );
}
