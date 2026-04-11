import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import {
  Wallet, Shield, BarChart3, Users, CheckCircle2, ArrowRight,
  Smartphone, FileText, Bell, Lock, Zap, Globe,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Easing } from "framer-motion";

const easeOut: Easing = [0, 0, 0.2, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.5, ease: easeOut } }),
};

const features = [
  { icon: Wallet, title: "Float Management", desc: "Allocate, top-up, and track float balances across branches in real time." },
  { icon: FileText, title: "Expense Tracking", desc: "Submit, categorize, and audit expenses with receipt uploads and status workflows." },
  { icon: Shield, title: "Policy Engine", desc: "Define spending limits and auto-enforce compliance before expenses are submitted." },
  { icon: CheckCircle2, title: "Approval Workflows", desc: "Multi-level approvals with comments, flags, and instant status updates." },
  { icon: BarChart3, title: "Reports & Analytics", desc: "Visual dashboards with trend lines, branch comparisons, and exportable summaries." },
  { icon: Bell, title: "Real-Time Alerts", desc: "Low float warnings, approval notifications, and policy violation alerts." },
  { icon: Users, title: "Role-Based Access", desc: "Five distinct roles with server-enforced permissions and audit trails." },
  { icon: Smartphone, title: "M-Pesa Integration", desc: "Mobile money payments and float top-ups via Safaricom Daraja API." },
  { icon: Lock, title: "Enterprise Security", desc: "JWT auth, Spring Security filters, RBAC, and encrypted data at rest." },
];

const stats = [
  { value: "99.9%", label: "Uptime SLA" },
  { value: "5", label: "User Roles" },
  { value: "<2s", label: "Avg Response" },
  { value: "256-bit", label: "Encryption" },
];

const trustItems = [
  "SOC 2 Type II compliant",
  "End-to-end audit trail",
  "Multi-branch scalability",
  "Real-time financial visibility",
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/landing" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary">
              <Wallet className="h-4.5 w-4.5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold tracking-tight">FloatFlow</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#security" className="hover:text-foreground transition-colors">Security</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Platform</a>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign In</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/register">Get Started <ArrowRight className="ml-1.5 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-56 w-56 rounded-full bg-accent/8 blur-3xl" />

        <div className="relative mx-auto max-w-6xl px-6 pt-24 pb-20 lg:pt-32 lg:pb-28">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-secondary px-4 py-1.5 text-xs font-medium text-secondary-foreground">
              <Zap className="h-3.5 w-3.5 text-primary" />
              Enterprise Float & Petty Cash Platform
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl leading-[1.1]">
              Take control of
              <span className="block text-primary">every shilling.</span>
            </h1>
            <p className="mt-6 text-lg text-muted-foreground max-w-2xl leading-relaxed">
              FloatFlow digitizes float allocation, expense tracking, and petty cash management for multi-branch organizations — with policy-driven compliance and real-time visibility.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/register">Start Free Trial <ArrowRight className="ml-1.5 h-4 w-4" /></Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a href="#features">See Features</a>
              </Button>
            </div>
          </motion.div>

          {/* Hero visual - dashboard mockup */}
          <motion.div
            initial={{ opacity: 0, y: 48, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }}
            className="mt-16 rounded-2xl border bg-card p-2 shadow-xl"
          >
            <div className="rounded-xl bg-muted/50 p-6 sm:p-10">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: "Total Float", value: "KES 12.4M", color: "text-primary" },
                  { label: "Active Branches", value: "24", color: "text-success" },
                  { label: "Pending Approvals", value: "18", color: "text-warning" },
                  { label: "This Month", value: "KES 3.2M", color: "text-accent" },
                ].map((stat) => (
                  <div key={stat.label} className="rounded-lg bg-card border p-4">
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={cn("text-xl sm:text-2xl font-bold mt-1", stat.color)}>{stat.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="rounded-lg bg-card border p-4 h-24">
                    <div className="h-2 w-16 rounded bg-muted mb-2" />
                    <div className="h-2 w-24 rounded bg-muted/60 mb-2" />
                    <div className="h-8 w-full rounded bg-muted/30 mt-auto" />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-14"
          >
            <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Features</motion.p>
            <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold tracking-tight">Everything you need to manage float</motion.h2>
            <motion.p variants={fadeUp} custom={2} className="mt-3 text-muted-foreground max-w-xl mx-auto">From allocation to reconciliation, FloatFlow covers the entire float lifecycle with enterprise-grade controls.</motion.p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-40px" }}
                custom={i}
                variants={fadeUp}
                className="group rounded-xl border bg-card p-6 transition-shadow hover:shadow-lg"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 mb-4 group-hover:bg-primary/15 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold mb-1.5">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 border-y bg-muted/30">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                custom={i}
                variants={fadeUp}
                className="text-center"
              >
                <p className="text-3xl sm:text-4xl font-extrabold text-primary">{s.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{s.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security / Trust */}
      <section id="security" className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <motion.p variants={fadeUp} custom={0} className="text-sm font-semibold text-primary uppercase tracking-wider mb-2">Security</motion.p>
              <motion.h2 variants={fadeUp} custom={1} className="text-3xl sm:text-4xl font-bold tracking-tight">Enterprise-grade security, built in</motion.h2>
              <motion.p variants={fadeUp} custom={2} className="mt-3 text-muted-foreground leading-relaxed">
                FloatFlow is built on Java 25 with Spring Boot 4.0.3, featuring JWT authentication, Spring Security filter chains, and role-based access control — all backed by PostgreSQL with encrypted data at rest.
              </motion.p>
              <motion.div variants={fadeUp} custom={3} className="mt-8 space-y-3">
                {trustItems.map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-4.5 w-4.5 text-success shrink-0" />
                    <span className="text-sm font-medium">{item}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 32 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="grid grid-cols-2 gap-4"
            >
              {[
                { icon: Lock, label: "JWT Auth", detail: "15min TTL + refresh rotation" },
                { icon: Shield, label: "Spring Security", detail: "Multi-layer filter chain" },
                { icon: Users, label: "RBAC", detail: "5 roles, server-enforced" },
                { icon: Globe, label: "TLS/HTTPS", detail: "Certificate pinning" },
              ].map((item) => (
                <div key={item.label} className="rounded-xl border bg-card p-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 mb-3">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <p className="font-semibold text-sm">{item.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{item.detail}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-28">
        <div className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-2xl bg-primary p-10 sm:p-16 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-primary/80" />
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground">
                Ready to modernize your float management?
              </h2>
              <p className="mt-4 text-primary-foreground/80 max-w-lg mx-auto">
                Join organizations already using FloatFlow to gain real-time financial visibility and policy-driven compliance.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button size="lg" variant="secondary" asChild className="text-base px-8 gap-2">
                  <Link to="/login">Get Started Free <ArrowRight className="h-4 w-4" /></Link>
                </Button>
                <Button size="lg" variant="outline" asChild className="text-base px-8 border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10">
                  <a href="#features">Learn More</a>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-10">
        <div className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
                <Wallet className="h-3.5 w-3.5 text-primary-foreground" />
              </div>
              <span className="font-bold">FloatFlow</span>
            </div>
            <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} FloatFlow. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-muted-foreground">
              <span className="hover:text-foreground cursor-pointer transition-colors">Privacy</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Terms</span>
              <span className="hover:text-foreground cursor-pointer transition-colors">Contact</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
