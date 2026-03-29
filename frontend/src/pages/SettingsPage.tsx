import { useState } from "react";
import { useAuth, ROLE_LABELS } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { User, Bell, Palette, Shield, Save, Camera } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();

  // Profile state
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [phone, setPhone] = useState("+254 712 345 678");
  const [branch, setBranch] = useState(user?.branch ?? "Nairobi CBD");

  // Display prefs
  const [compactMode, setCompactMode] = useState(false);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);

  // Notification prefs
  const [notifPrefs, setNotifPrefs] = useState({
    expenseSubmitted: true,
    expenseApproved: true,
    expenseRejected: true,
    lowFloat: true,
    policyUpdates: false,
    weeklyReport: true,
    emailNotifs: true,
    pushNotifs: false,
    smsAlerts: true,
  });

  const toggleNotif = (key: keyof typeof notifPrefs) => {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = () => {
    toast.success("Profile updated successfully");
  };

  const handleSaveNotifs = () => {
    toast.success("Notification preferences saved");
  };

  const handleSaveAppearance = () => {
    toast.success("Appearance settings saved");
  };

  const initials = (user?.name ?? "U").split(" ").map((n) => n[0]).join("").slice(0, 2);

  const card = (children: React.ReactNode) => (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6"
    >
      {children}
    </motion.div>
  );

  return (
    <div>
      <PageHeader title="Settings" description="Manage your account, preferences, and notifications" />

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="bg-secondary">
          <TabsTrigger value="profile" className="gap-1.5"><User className="h-3.5 w-3.5" /> Profile</TabsTrigger>
          <TabsTrigger value="appearance" className="gap-1.5"><Palette className="h-3.5 w-3.5" /> Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="gap-1.5"><Bell className="h-3.5 w-3.5" /> Notifications</TabsTrigger>
          <TabsTrigger value="security" className="gap-1.5"><Shield className="h-3.5 w-3.5" /> Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          {card(
            <>
              <h3 className="text-sm font-semibold mb-4">User Profile</h3>
              <div className="flex flex-col sm:flex-row gap-6">
                <div className="flex flex-col items-center gap-2">
                  <Avatar className="h-20 w-20 text-lg">
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Camera className="h-3.5 w-3.5" /> Change
                  </Button>
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value.replace(/[<>]/g, ""))} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="settings-email">Email</Label>
                    <Input id="settings-email" type="email" value={email} onChange={(e) => setEmail(e.target.value.replace(/[<>]/g, ""))} maxLength={255} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value.replace(/[<>]/g, ""))} maxLength={20} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="branch">Branch</Label>
                    <Input id="branch" value={branch} onChange={(e) => setBranch(e.target.value.replace(/[<>]/g, ""))} maxLength={100} />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <Input value={ROLE_LABELS[user?.role ?? "employee"]} disabled className="bg-muted" />
                  </div>
                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input value={user?.id ?? ""} disabled className="bg-muted font-mono text-xs" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveProfile} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save Profile</Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          {card(
            <>
              <h3 className="text-sm font-semibold mb-4">Theme</h3>
              <div className="grid grid-cols-3 gap-3 max-w-md">
                {(["light", "dark", "system"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={cn(
                      "rounded-lg border-2 p-4 text-center transition-all",
                      theme === t ? "border-primary bg-primary/5" : "border-transparent bg-secondary hover:bg-muted"
                    )}
                  >
                    <div className={cn(
                      "mx-auto mb-2 h-8 w-8 rounded-lg",
                      t === "light" ? "bg-background border" : t === "dark" ? "bg-foreground" : "bg-gradient-to-br from-background to-foreground"
                    )} />
                    <p className="text-xs font-medium capitalize">{t}</p>
                  </button>
                ))}
              </div>
            </>
          )}
          {card(
            <>
              <h3 className="text-sm font-semibold mb-4">Display Preferences</h3>
              <div className="space-y-4 max-w-md">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Compact Mode</p>
                    <p className="text-xs text-muted-foreground">Reduce spacing for denser information display</p>
                  </div>
                  <Switch checked={compactMode} onCheckedChange={setCompactMode} />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Animations</p>
                    <p className="text-xs text-muted-foreground">Enable smooth transitions and motion effects</p>
                  </div>
                  <Switch checked={animationsEnabled} onCheckedChange={setAnimationsEnabled} />
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select defaultValue="dd-mm-yyyy">
                    <SelectTrigger className="max-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dd-mm-yyyy">DD/MM/YYYY</SelectItem>
                      <SelectItem value="mm-dd-yyyy">MM/DD/YYYY</SelectItem>
                      <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency Display</Label>
                  <Select defaultValue="kes">
                    <SelectTrigger className="max-w-[200px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kes">KES (Ksh)</SelectItem>
                      <SelectItem value="usd">USD ($)</SelectItem>
                      <SelectItem value="eur">EUR (€)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveAppearance} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save Appearance</Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          {card(
            <>
              <h3 className="text-sm font-semibold mb-4">Event Notifications</h3>
              <div className="space-y-4 max-w-md">
                {([
                  { key: "expenseSubmitted" as const, label: "Expense Submitted", desc: "When a new expense is submitted for approval" },
                  { key: "expenseApproved" as const, label: "Expense Approved", desc: "When your expense is approved" },
                  { key: "expenseRejected" as const, label: "Expense Rejected", desc: "When your expense is rejected" },
                  { key: "lowFloat" as const, label: "Low Float Alert", desc: "When branch float drops below 20%" },
                  { key: "policyUpdates" as const, label: "Policy Updates", desc: "When spending policies are modified" },
                  { key: "weeklyReport" as const, label: "Weekly Summary", desc: "Receive a weekly financial summary report" },
                ]).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch checked={notifPrefs[key]} onCheckedChange={() => toggleNotif(key)} />
                  </div>
                ))}
              </div>
            </>
          )}
          {card(
            <>
              <h3 className="text-sm font-semibold mb-4">Delivery Channels</h3>
              <div className="space-y-4 max-w-md">
                {([
                  { key: "emailNotifs" as const, label: "Email", desc: "Receive notifications via email" },
                  { key: "pushNotifs" as const, label: "Push Notifications", desc: "Browser push notifications" },
                  { key: "smsAlerts" as const, label: "SMS Alerts", desc: "Critical alerts via SMS" },
                ]).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <Switch checked={notifPrefs[key]} onCheckedChange={() => toggleNotif(key)} />
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={handleSaveNotifs} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Save Notifications</Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          {card(
            <>
              <h3 className="text-sm font-semibold mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current-pw">Current Password</Label>
                  <Input id="current-pw" type="password" placeholder="Enter current password" maxLength={128} autoComplete="current-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-pw">New Password</Label>
                  <Input id="new-pw" type="password" placeholder="Enter new password" maxLength={128} autoComplete="new-password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-pw">Confirm New Password</Label>
                  <Input id="confirm-pw" type="password" placeholder="Confirm new password" maxLength={128} autoComplete="new-password" />
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <Button onClick={() => toast.success("Password updated successfully")} className="gap-1.5"><Save className="h-3.5 w-3.5" /> Update Password</Button>
              </div>
            </>
          )}
          {card(
            <>
              <h3 className="text-sm font-semibold mb-4">Active Sessions</h3>
              <div className="space-y-3 max-w-lg">
                {[
                  { device: "Chrome on macOS", ip: "192.168.1.42", time: "Active now", current: true },
                  { device: "Safari on iPhone", ip: "10.0.0.15", time: "2 hours ago", current: false },
                ].map((s) => (
                  <div key={s.device} className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <p className="text-sm font-medium">{s.device}</p>
                      <p className="text-xs text-muted-foreground">{s.ip} · {s.time}</p>
                    </div>
                    {s.current ? (
                      <span className="text-xs font-medium text-success">Current</span>
                    ) : (
                      <Button variant="outline" size="sm" onClick={() => toast.success("Session revoked")}>Revoke</Button>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}