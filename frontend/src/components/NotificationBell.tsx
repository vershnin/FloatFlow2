import { useState, useEffect, useCallback } from "react";
import { Bell, Receipt, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, Settings2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsRead,
  Notification,
} from "@/api/notificationService";

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

const defaultTypeColor = "text-muted-foreground bg-muted";

export function NotificationBell() {
  const navigate = useNavigate();
  const [items, setItems] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const unreadCount = items.filter((n) => !n.read).length;

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getNotifications();
      setItems(Array.isArray(res) ? res : []);
    } catch (error) {
      console.error("Failed to load notifications", error);
      setItems([]);
      toast.error("Unable to load notifications.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    const interval = window.setInterval(async () => {
      try {
        const latest = await getNotifications();
        if (!Array.isArray(latest) || latest.length === 0) return;

        setItems((prev) => {
          const existingIds = new Set(prev.map((n) => n.id));
          const newItems = latest.filter((n) => !existingIds.has(n.id));
          if (newItems.length === 0) return prev;

          newItems.forEach((n) => {
            toast(n.title, {
              description: n.message,
              action: n.link ? { label: "View", onClick: () => navigate(n.link!) } : undefined,
            });
          });
          return [...newItems, ...prev].slice(0, 50);
        });
      } catch (error) {
        console.error("Polling notifications failed", error);
      }
    }, 15000);

    return () => window.clearInterval(interval);
  }, [navigate]);

  const markAllRead = async () => {
    try {
      await markAllNotificationsRead();
    } catch (error) {
      console.warn("Mark all notifications as read failed", error);
    } finally {
      setItems((prev) => prev.map((n) => ({ ...n, read: true })));
    }
  };

  const handleClick = async (notification: Notification) => {
    try {
      if (!notification.read) {
        await markNotificationAsRead(notification.id);
      }
    } catch (error) {
      console.warn("Mark notification read failed", error);
    } finally {
      setItems((prev) => prev.map((n) => n.id === notification.id ? { ...n, read: true } : n));
      if (notification.link) {
        navigate(notification.link);
        setOpen(false);
      }
    }
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
          {isLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">Loading notifications...</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No notifications</div>
          ) : (
            items.map((n) => {
              const Icon = typeIcons[n.type] ?? Bell;
              const iconColor = typeColors[n.type] ?? defaultTypeColor;
              return (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={cn("flex items-start gap-3 w-full text-left px-4 py-3 border-b last:border-0 hover:bg-muted/50 transition-colors", !n.read && "bg-primary/5")}
                >
                  <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-full mt-0.5", iconColor)}>
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
