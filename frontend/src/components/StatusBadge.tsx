import { cn } from "@/lib/utils";

const statusStyles: Record<string, string> = {
  approved: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  rejected: "bg-destructive/10 text-destructive",
  paid: "bg-primary/10 text-primary",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", statusStyles[status] || "bg-muted text-muted-foreground")}>
      {status}
    </span>
  );
}
