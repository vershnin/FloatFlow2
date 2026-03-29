// Branch Manager Dashboard Data
export const branchManagerData = {
  kpis: [
    { title: "Float Balance", value: "KES 450,000", change: "+5.2%", trend: "up" as const },
    { title: "Pending Requests", value: "12", change: "-2", trend: "down" as const },
    { title: "This Week Usage", value: "KES 125,500", change: "+8.1%", trend: "up" as const },
    { title: "Active Employees", value: "24", change: "+1", trend: "up" as const },
  ],
  recentExpenses: [
    { id: "EXP-001", description: "Office Supplies", amount: "KES 5,200", status: "pending", date: "2026-03-08" },
    { id: "EXP-002", description: "Client Entertainment", amount: "KES 12,800", status: "approved", date: "2026-03-07" },
    { id: "EXP-003", description: "Travel Allowance", amount: "KES 8,500", status: "pending", date: "2026-03-06" },
    { id: "EXP-004", description: "Training Workshop", amount: "KES 15,000", status: "approved", date: "2026-03-05" },
    { id: "EXP-005", description: "Equipment Maintenance", amount: "KES 3,200", status: "approved", date: "2026-03-04" },
  ],
  monthlyUsage: [
    { week: "Week 1", amount: 45000 },
    { week: "Week 2", amount: 52000 },
    { week: "Week 3", amount: 38000 },
    { week: "Week 4", amount: 65000 },
    { week: "Week 5", amount: 42000 },
  ],
};

// Employee Dashboard Data
export const employeeData = {
  stats: {
    total: 28,
    approved: 18,
    pending: 7,
    rejected: 3,
  },
  myExpenses: [
    { id: "EXP-001", description: "Lunch Meeting", amount: "KES 2,500", status: "approved", date: "2026-03-08" },
    { id: "EXP-002", description: "Transport", amount: "KES 1,200", status: "pending", date: "2026-03-07" },
    { id: "EXP-003", description: "Office Supplies", amount: "KES 3,100", status: "approved", date: "2026-03-06" },
    { id: "EXP-004", description: "Client Meeting", amount: "KES 4,500", status: "rejected", date: "2026-03-05" },
    { id: "EXP-005", description: "Training Materials", amount: "KES 2,200", status: "approved", date: "2026-03-04" },
  ],
};

// Finance Officer Dashboard Data
export const financeOfficerData = {
  kpis: [
    { title: "Total Float Allocated", value: "KES 2,450,000", change: "+12.5%", trend: "up" as const },
    { title: "Pending Approvals", value: "23", change: "-3", trend: "down" as const },
    { title: "Monthly Expenses", value: "KES 890,200", change: "+8.2%", trend: "up" as const },
    { title: "Utilization Rate", value: "76%", change: "+4.2%", trend: "up" as const },
  ],
  expenseTrend: [
    { month: "Sep", amount: 620000 },
    { month: "Oct", amount: 710000 },
    { month: "Nov", amount: 680000 },
    { month: "Dec", amount: 890000 },
    { month: "Jan", amount: 750000 },
    { month: "Feb", amount: 820000 },
    { month: "Mar", amount: 890200 },
  ],
  branchPerformance: [
    { branch: "Nairobi CBD", allocated: "KES 450,000", used: "KES 380,000", utilization: 84 },
    { branch: "Mombasa", allocated: "KES 350,000", used: "KES 245,000", utilization: 70 },
    { branch: "Kisumu", allocated: "KES 250,000", used: "KES 210,000", utilization: 84 },
    { branch: "Nakuru", allocated: "KES 200,000", used: "KES 165,000", utilization: 82 },
    { branch: "Eldoret", allocated: "KES 150,000", used: "KES 125,000", utilization: 83 },
  ],
};

// Auditor Dashboard Data
export const auditorData = {
  systemStats: [
    { title: "Total Transactions", value: "1,248" },
    { title: "Flagged Items", value: "12" },
    { title: "Data Integrity", value: "99.8%" },
    { title: "Audit Period", value: "90 days" },
  ],
  recentLogs: [
    { timestamp: "2026-03-08 14:32", user: "john.doe@company.com", action: "Float Allocation Approved", detail: "KES 50,000 approved for Nairobi branch", severity: "info" as const },
    { timestamp: "2026-03-08 13:15", user: "jane.smith@company.com", action: "Expense Submitted", detail: "Travel expense KES 8,200 submitted", severity: "info" as const },
    { timestamp: "2026-03-08 11:45", user: "admin@company.com", action: "Policy Updated", detail: "Petty cash limit increased to KES 50,000", severity: "warning" as const },
    { timestamp: "2026-03-07 16:20", user: "mike.wilson@company.com", action: "Expense Rejected", detail: "Duplicate receipt detected", severity: "warning" as const },
    { timestamp: "2026-03-07 14:10", user: "system", action: "Data Sync", detail: "All branches synced successfully", severity: "info" as const },
  ],
};
