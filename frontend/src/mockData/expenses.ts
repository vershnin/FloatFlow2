export type ExpenseStatus = "pending" | "approved" | "rejected" | "paid";

export interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string;
  branch: string;
  submittedBy: string;
  date: string;
  status: ExpenseStatus;
  receiptUrl?: string;
}

export const expenseCategories = [
  "Office Supplies", "Transport", "Meals & Entertainment", "Repairs & Maintenance",
  "Cleaning Services", "Courier & Postage", "Stationery", "Utilities", "Miscellaneous",
];

export const expenses: Expense[] = [
  { id: "EXP-101", amount: 3200, category: "Office Supplies", description: "Printer cartridges and paper", branch: "Nairobi CBD", submittedBy: "Peter Mwangi", date: "2026-03-08", status: "approved" },
  { id: "EXP-102", amount: 8500, category: "Transport", description: "Staff transport for client visits", branch: "Nairobi CBD", submittedBy: "Grace Wanjiku", date: "2026-03-08", status: "pending" },
  { id: "EXP-103", amount: 4800, category: "Meals & Entertainment", description: "Client meeting lunch at Sarova", branch: "Mombasa", submittedBy: "Ali Hassan", date: "2026-03-07", status: "approved" },
  { id: "EXP-104", amount: 12000, category: "Repairs & Maintenance", description: "AC unit repair in boardroom", branch: "Nairobi CBD", submittedBy: "Peter Mwangi", date: "2026-03-07", status: "pending" },
  { id: "EXP-105", amount: 6000, category: "Cleaning Services", description: "Monthly deep cleaning", branch: "Kisumu", submittedBy: "Mary Akinyi", date: "2026-03-06", status: "paid" },
  { id: "EXP-106", amount: 1500, category: "Courier & Postage", description: "Document courier to HQ", branch: "Nakuru", submittedBy: "John Kiprop", date: "2026-03-06", status: "rejected" },
  { id: "EXP-107", amount: 2800, category: "Stationery", description: "Branded envelopes and folders", branch: "Eldoret", submittedBy: "Sarah Chebet", date: "2026-03-05", status: "approved" },
  { id: "EXP-108", amount: 45000, category: "Repairs & Maintenance", description: "Office renovation phase 1", branch: "Kisumu", submittedBy: "Mary Akinyi", date: "2026-03-04", status: "pending" },
  { id: "EXP-109", amount: 950, category: "Miscellaneous", description: "Water dispenser refill", branch: "Thika", submittedBy: "James Maina", date: "2026-03-04", status: "paid" },
  { id: "EXP-110", amount: 15000, category: "Transport", description: "Monthly fuel allowance", branch: "Mombasa", submittedBy: "Ali Hassan", date: "2026-03-03", status: "approved" },
];