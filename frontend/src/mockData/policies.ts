export interface Policy {
  id: string;
  name: string;
  description: string;
  type: "max_per_expense" | "category_limit" | "daily_limit";
  category?: string;
  limit: number;
  enabled: boolean;
  createdBy: string;
  updatedAt: string;
}

export const policies: Policy[] = [
  { id: "POL-001", name: "Maximum Expense Amount", description: "Maximum amount allowed per single expense claim", type: "max_per_expense", limit: 50000, enabled: true, createdBy: "Jane Kamau", updatedAt: "2026-03-01" },
  { id: "POL-002", name: "Transport Category Limit", description: "Maximum monthly transport expense per branch", type: "category_limit", category: "Transport", limit: 30000, enabled: true, createdBy: "David Ochieng", updatedAt: "2026-02-28" },
  { id: "POL-003", name: "Meals & Entertainment Limit", description: "Maximum per-event entertainment expense", type: "category_limit", category: "Meals & Entertainment", limit: 10000, enabled: true, createdBy: "David Ochieng", updatedAt: "2026-02-25" },
  { id: "POL-004", name: "Daily Expense Cap", description: "Maximum total expenses per branch per day", type: "daily_limit", limit: 25000, enabled: true, createdBy: "Jane Kamau", updatedAt: "2026-03-05" },
  { id: "POL-005", name: "Repairs & Maintenance Cap", description: "Maximum single repair/maintenance expense", type: "category_limit", category: "Repairs & Maintenance", limit: 40000, enabled: false, createdBy: "David Ochieng", updatedAt: "2026-02-20" },
];

export const policyTypes = [
  { value: "max_per_expense", label: "Max Per Expense" },
  { value: "category_limit", label: "Category Limit" },
  { value: "daily_limit", label: "Daily Limit" },
];