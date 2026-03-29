export const kpiCards = [
  { title: "Total Float Allocated", value: "KES 2,450,000", change: "+12.5%", trend: "up" as const, icon: "Wallet" },
  { title: "Pending Approvals", value: "23", change: "-3", trend: "down" as const, icon: "Clock" },
  { title: "Monthly Expenses", value: "KES 890,200", change: "+8.2%", trend: "up" as const, icon: "TrendingUp" },
  { title: "Active Branches", value: "14", change: "+2", trend: "up" as const, icon: "Building2" },
];

export const recentTransactions = [
  { id: "TXN-001", branch: "Nairobi CBD", type: "Float Allocation", amount: "KES 150,000", status: "approved", date: "2026-03-08" },
  { id: "TXN-002", branch: "Mombasa", type: "Petty Cash", amount: "KES 12,500", status: "pending", date: "2026-03-08" },
  { id: "TXN-003", branch: "Kisumu", type: "Expense Claim", amount: "KES 8,200", status: "approved", date: "2026-03-07" },
  { id: "TXN-004", branch: "Nakuru", type: "Float Top-up", amount: "KES 75,000", status: "rejected", date: "2026-03-07" },
  { id: "TXN-005", branch: "Eldoret", type: "Petty Cash", amount: "KES 5,800", status: "pending", date: "2026-03-06" },
];

export const monthlySpendData = [
  { month: "Sep", amount: 620000 },
  { month: "Oct", amount: 710000 },
  { month: "Nov", amount: 680000 },
  { month: "Dec", amount: 890000 },
  { month: "Jan", amount: 750000 },
  { month: "Feb", amount: 820000 },
  { month: "Mar", amount: 890200 },
];

export const branchAllocation = [
  { name: "Nairobi CBD", value: 35 },
  { name: "Mombasa", value: 22 },
  { name: "Kisumu", value: 15 },
  { name: "Nakuru", value: 12 },
  { name: "Eldoret", value: 10 },
  { name: "Others", value: 6 },
];