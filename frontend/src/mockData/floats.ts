export type FloatStatus = "active" | "low" | "exhausted";

export interface BranchFloat {
  id: string;
  branch: string;
  initialAmount: number;
  usedAmount: number;
  remainingBalance: number;
  status: FloatStatus;
  lastTopUp: string;
  allocatedBy: string;
}

export interface FloatTransaction {
  id: string;
  branch: string;
  type: "allocation" | "top-up" | "expense" | "withdrawal";
  amount: number;
  date: string;
  performedBy: string;
  reference: string;
}

export const branchFloats: BranchFloat[] = [
  { id: "FLT-001", branch: "Nairobi CBD", initialAmount: 500000, usedAmount: 420000, remainingBalance: 80000, status: "low", lastTopUp: "2026-03-05", allocatedBy: "David Ochieng" },
  { id: "FLT-002", branch: "Mombasa", initialAmount: 350000, usedAmount: 180000, remainingBalance: 170000, status: "active", lastTopUp: "2026-03-03", allocatedBy: "David Ochieng" },
  { id: "FLT-003", branch: "Kisumu", initialAmount: 250000, usedAmount: 240000, remainingBalance: 10000, status: "exhausted", lastTopUp: "2026-02-28", allocatedBy: "Jane Kamau" },
  { id: "FLT-004", branch: "Nakuru", initialAmount: 200000, usedAmount: 120000, remainingBalance: 80000, status: "active", lastTopUp: "2026-03-06", allocatedBy: "David Ochieng" },
  { id: "FLT-005", branch: "Eldoret", initialAmount: 180000, usedAmount: 160000, remainingBalance: 20000, status: "low", lastTopUp: "2026-03-01", allocatedBy: "Jane Kamau" },
  { id: "FLT-006", branch: "Thika", initialAmount: 150000, usedAmount: 30000, remainingBalance: 120000, status: "active", lastTopUp: "2026-03-07", allocatedBy: "David Ochieng" },
];

export const floatTransactions: FloatTransaction[] = [
  { id: "FTX-001", branch: "Nairobi CBD", type: "allocation", amount: 500000, date: "2026-02-01", performedBy: "Jane Kamau", reference: "Initial allocation Q1" },
  { id: "FTX-002", branch: "Nairobi CBD", type: "top-up", amount: 100000, date: "2026-03-05", performedBy: "David Ochieng", reference: "Emergency top-up" },
  { id: "FTX-003", branch: "Mombasa", type: "allocation", amount: 350000, date: "2026-02-01", performedBy: "Jane Kamau", reference: "Initial allocation Q1" },
  { id: "FTX-004", branch: "Kisumu", type: "expense", amount: -45000, date: "2026-03-06", performedBy: "Grace Wanjiku", reference: "Office renovation" },
  { id: "FTX-005", branch: "Nakuru", type: "top-up", amount: 50000, date: "2026-03-06", performedBy: "David Ochieng", reference: "Monthly top-up" },
  { id: "FTX-006", branch: "Eldoret", type: "withdrawal", amount: -25000, date: "2026-03-04", performedBy: "Peter Mwangi", reference: "Staff advance" },
  { id: "FTX-007", branch: "Thika", type: "allocation", amount: 150000, date: "2026-03-07", performedBy: "Jane Kamau", reference: "New branch setup" },
  { id: "FTX-008", branch: "Nairobi CBD", type: "expense", amount: -18500, date: "2026-03-08", performedBy: "Grace Wanjiku", reference: "Office supplies bulk" },
];

export const branches = ["Nairobi CBD", "Mombasa", "Kisumu", "Nakuru", "Eldoret", "Thika"];