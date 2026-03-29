import { useState, useEffect } from "react";
import { Bell, Receipt, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Settings2 } from "lucide-react";
import { notifications, type Notification } from "@/mockData/enterprise";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ElementType> = {
  expense_submitted: Receipt,
  expense_approved: CheckCircle2,
  expense_rejected: XCircle,
  low_float: AlertTriangle,
  policy_update: ShieldCheck,
  system: Settings2,
};

const typeColors: Record<string, string> = {
  expense_submitted: "text-primary bg-primary/10",
  expense_approved: "text-success bg-success/10",
  expense_rejected: "text-destructive bg-destructive/10",
  low_float: "text-warning bg-warning/10",
  policy_update: "text-accent bg-accent/10",
  system: "text-muted-foreground bg-muted",
};

export function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState(notifications);
  const [open, setOpen] = useState(false);
  const unreadCount = items.filter((n) => !n.read).length;

  // Simulate a new notification arriving after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      const newNotif: Notification = {
        id: `N-${Date.now()}`,
        type: "expense_submitted",
        title: "New Expense Submitted",
        message: "James Maina submitted EXP-112 (KES 4,600) for Office Supplies",
        timestamp: new Date().toLocaleString("en-GB", { hour12: false, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).replace(",", ""),
        read: false,
        link: "/approvals",
      };
      setItems((prev) => [newNotif, ...prev]);
      toast("New Expense Submitted", {
        description: "James Maina submitted EXP-112 (KES 4,600)",
        action: { label: "View", onClick: () => navigate("/approvals") },
      });
    }, 8000);
    return () => clearTimeout(timer);
  }, [navigate]);

  const markAllRead = () => setItems((prev) => prev.map((n) => ({ ...n, read: true })));

  const handleClick = (n: Notification) => {
    setItems((prev) => prev.map((item) => item.id === n.id ? { ...item, read: true } : item));
    if (n.link) { navigate(n.link); setOpen(false); }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-muted-foreground">
          <Bell className="h-4 w-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
          )}
        </div>
        <ScrollArea className="h-[380px]">
          {items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            items.map((n) => {
              const Icon = typeIcons[n.type];
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn("flex items-start gap-3 w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors",
                    !n.read && "bg-primary/5"
                  )}
                >
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5", typeColors[n.type])}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={cn("text-sm truncate", !n.read ? "font-semibold" : "font-medium")}>{n.title}</p>
                      {!n.read && <span className="h-2 w-2 rounded-full bg-primary shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">{n.timestamp}</p>
                  </div>
                </button>
              );
            })
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
