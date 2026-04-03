import { useState } from "react";
import { Plug, CheckCircle2, XCircle, Download, ExternalLink, Server, Database, Globe, Smartphone, Code2, Layers, Shield, Lock, KeyRound, Users, ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Integration {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  connected: boolean;
  category: string;
}

const integrations: Integration[] = [
  { id: "mpesa", name: "M-Pesa", description: "Mobile money payments and float top-ups via Safaricom M-Pesa API", icon: Smartphone, connected: true, category: "Payments" },
  { id: "sap", name: "SAP ERP", description: "Sync general ledger entries and chart of accounts", icon: Layers, connected: false, category: "ERP" },
  { id: "quickbooks", name: "QuickBooks", description: "Export expenses and financial reports to QuickBooks Online", icon: Database, connected: false, category: "Accounting" },
  { id: "xero", name: "Xero", description: "Automated reconciliation and expense categorization", icon: Globe, connected: false, category: "Accounting" },
  { id: "slack", name: "Slack", description: "Approval notifications and low float alerts to Slack channels", icon: ExternalLink, connected: true, category: "Communication" },
  { id: "email", name: "Email (SMTP)", description: "Transactional emails for approvals, alerts, and reports", icon: Server, connected: true, category: "Communication" },
];

const archItems = [
  { layer: "Frontend", tech: "React + TypeScript", detail: "Vite build, Tailwind CSS, Shadcn UI", icon: Code2, color: "bg-primary/10 text-primary" },
  { layer: "Backend API", tech: "Java 25 · Spring Boot 4.0.3", detail: "RESTful API with JWT authentication, Maven build", icon: Server, color: "bg-success/10 text-success" },
  { layer: "Database", tech: "PostgreSQL", detail: "Relational DB with JPA/Hibernate ORM", icon: Database, color: "bg-warning/10 text-warning" },
  { layer: "Realtime", tech: "WebSockets", detail: "Live notifications and dashboard updates", icon: Globe, color: "bg-accent/10 text-accent" },
  { layer: "Payments", tech: "M-Pesa Integration", detail: "Safaricom Daraja API for mobile money", icon: Smartphone, color: "bg-destructive/10 text-destructive" },
  { layer: "Infrastructure", tech: "Docker + Nginx", detail: "Containerized deployment with reverse proxy", icon: Layers, color: "bg-primary/10 text-primary" },
];

export default function IntegrationsPage() {
  const [items, setItems] = useState(integrations);

  const toggleConnection = (id: string) => {
    setItems((prev) => prev.map((item) => {
      if (item.id === id) {
        const newState = !item.connected;
        toast.success(newState ? `${item.name} connected` : `${item.name} disconnected`);
        return { ...item, connected: newState };
      }
      return item;
    }));
  };

  const handleExport = () => {
    toast.success("Generating G/L CSV export...", { description: "Your download will begin shortly" });
  };

  const connected = items.filter((i) => i.connected).length;

  return (
    <div>
      <PageHeader title="Integrations" description="Connect external systems and services">
        <Button variant="outline" onClick={handleExport}>
          <Download className="h-4 w-4" /> Export G/L CSV
        </Button>
      </PageHeader>

      {/* Status Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Plug className="h-5 w-5 text-primary" />
          </div>
          <div><p className="text-sm text-muted-foreground">Total Integrations</p><p className="text-xl font-bold">{items.length}</p></div>
        </div>
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
            <CheckCircle2 className="h-5 w-5 text-success" />
          </div>
          <div><p className="text-sm text-muted-foreground">Connected</p><p className="text-xl font-bold">{connected}</p></div>
        </div>
        <div className="glass-card p-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
            <XCircle className="h-5 w-5 text-muted-foreground" />
          </div>
          <div><p className="text-sm text-muted-foreground">Not Connected</p><p className="text-xl font-bold">{items.length - connected}</p></div>
        </div>
      </div>

      {/* Integration Cards */}
      <h3 className="text-sm font-semibold mb-3">System Integrations</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-8">
        {items.map((item, i) => (
          <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }} className={cn("glass-card p-5", !item.connected && "opacity-70")}>
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg shrink-0", item.connected ? "bg-success/10" : "bg-muted")}>
                  <item.icon className={cn("h-5 w-5", item.connected ? "text-success" : "text-muted-foreground")} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold">{item.name}</h4>
                    <span className="text-[10px] rounded-full bg-secondary px-2 py-0.5 text-secondary-foreground font-medium">{item.category}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    {item.connected ? (
                      <span className="inline-flex items-center gap-1 text-xs text-success font-medium"><CheckCircle2 className="h-3 w-3" /> Connected</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><XCircle className="h-3 w-3" /> Not Connected</span>
                    )}
                  </div>
                </div>
              </div>
              <Switch checked={item.connected} onCheckedChange={() => toggleConnection(item.id)} />
            </div>
          </motion.div>
        ))}
      </div>

      {/* System Architecture */}
      <h3 className="text-sm font-semibold mb-3">System Architecture</h3>
      <div className="glass-card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {archItems.map((a, i) => (
            <motion.div key={a.layer} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-lg border p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", a.color)}>
                  <a.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{a.layer}</p>
                  <p className="text-sm font-semibold leading-tight">{a.tech}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{a.detail}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Security & Auth Architecture */}
      <h3 className="text-sm font-semibold mb-3 mt-8">Security & Authentication</h3>
      <div className="glass-card p-5 space-y-6">
        {/* JWT Token Flow */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <KeyRound className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">JWT Token Flow</p>
              <p className="text-xs text-muted-foreground">Stateless authentication with refresh rotation</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            {["Client Login", "Spring Security Filter", "JWT Issued (15min TTL)", "Refresh Token (7d, HTTP-Only)", "Token Validation on Request", "Auto-Refresh on Expiry"].map((step, i, arr) => (
              <div key={step} className="flex items-center gap-2">
                <span className="rounded-md border bg-secondary px-2.5 py-1.5 font-medium text-secondary-foreground">{step}</span>
                {i < arr.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
            ))}
          </div>
        </div>

        <div className="border-t" />

        {/* Spring Security Filters */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-warning/10">
              <Shield className="h-4 w-4 text-warning" />
            </div>
            <div>
              <p className="text-sm font-semibold">Spring Security Filter Chain</p>
              <p className="text-xs text-muted-foreground">Multi-layer request processing pipeline</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { name: "CORS Filter", desc: "Whitelist allowed origins & methods" },
              { name: "JWT Auth Filter", desc: "Extract & validate Bearer tokens" },
              { name: "Rate Limiter", desc: "Throttle requests per user/IP" },
              { name: "CSRF Protection", desc: "Token-based CSRF for state-changing ops" },
            ].map((f) => (
              <div key={f.name} className="rounded-lg border p-3">
                <p className="text-xs font-semibold">{f.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t" />

        {/* RBAC */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-success/10">
              <Users className="h-4 w-4 text-success" />
            </div>
            <div>
              <p className="text-sm font-semibold">Role-Based Access Control</p>
              <p className="text-xs text-muted-foreground">Server-enforced permissions with Spring @PreAuthorize</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 pr-4 font-semibold text-muted-foreground">Role</th>
                  <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Floats</th>
                  <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Expenses</th>
                  <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Approvals</th>
                  <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Policies</th>
                  <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Reports</th>
                  <th className="text-center py-2 px-2 font-semibold text-muted-foreground">Audit</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { role: "Admin", perms: [true, true, true, true, true, true] },
                  { role: "Finance Officer", perms: [true, true, true, true, true, false] },
                  { role: "Branch Manager", perms: [true, true, true, false, false, false] },
                  { role: "Employee", perms: [false, true, false, false, false, false] },
                  { role: "Auditor", perms: [false, false, false, false, true, true] },
                ].map((r) => (
                  <tr key={r.role} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{r.role}</td>
                    {r.perms.map((p, i) => (
                      <td key={i} className="text-center py-2 px-2">
                        {p ? <CheckCircle2 className="h-3.5 w-3.5 text-success mx-auto" /> : <Lock className="h-3.5 w-3.5 text-muted-foreground/40 mx-auto" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="border-t" />

        {/* Frontend Security */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-destructive/10">
              <Lock className="h-4 w-4 text-destructive" />
            </div>
            <div>
              <p className="text-sm font-semibold">Frontend Security Measures</p>
              <p className="text-xs text-muted-foreground">Client-side protections complementing server enforcement</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { name: "Route Guards", desc: "ProtectedRoute with role-based access checks" },
              { name: "Input Sanitization", desc: "XSS prevention via input validation & encoding" },
              { name: "Session Timeout", desc: "Auto-logout on JWT expiry with refresh flow" },
              { name: "HTTPS Only", desc: "All API calls over TLS with certificate pinning" },
              { name: "CSP Headers", desc: "Content Security Policy preventing script injection" },
              { name: "Audit Logging", desc: "All user actions logged with IP & timestamp" },
            ].map((f) => (
              <div key={f.name} className="rounded-lg border p-3">
                <p className="text-xs font-semibold">{f.name}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
