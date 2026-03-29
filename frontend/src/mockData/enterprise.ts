export interface ApprovalRequest {
  id: string;
  expenseId: string;
  description: string;
  amount: number;
  category: string;
  branch: string;
  submittedBy: string;
  submittedDate: string;
  status: "pending" | "approved" | "rejected";
  approverComment?: string;
  approvedBy?: string;
  approvedDate?: string;
  receiptAttached: boolean;
}

export const approvalRequests: ApprovalRequest[] = [
  { id: "APR-001", expenseId: "EXP-102", description: "Staff transport for client visits", amount: 8500, category: "Transport", branch: "Nairobi CBD", submittedBy: "Grace Wanjiku", submittedDate: "2026-03-08", status: "pending", receiptAttached: true },
  { id: "APR-002", expenseId: "EXP-104", description: "AC unit repair in boardroom", amount: 12000, category: "Repairs & Maintenance", branch: "Nairobi CBD", submittedBy: "Peter Mwangi", submittedDate: "2026-03-07", status: "pending", receiptAttached: true },
  { id: "APR-003", expenseId: "EXP-108", description: "Office renovation phase 1", amount: 45000, category: "Repairs & Maintenance", branch: "Kisumu", submittedBy: "Mary Akinyi", submittedDate: "2026-03-04", status: "pending", receiptAttached: false },
  { id: "APR-004", expenseId: "EXP-099", description: "Team building lunch event", amount: 3500, category: "Meals & Entertainment", branch: "Nairobi CBD", submittedBy: "Peter Mwangi", submittedDate: "2026-03-04", status: "approved", approverComment: "Approved — within budget", approvedBy: "Grace Wanjiku", approvedDate: "2026-03-05", receiptAttached: true },
  { id: "APR-005", expenseId: "EXP-106", description: "Document courier to HQ", amount: 1500, category: "Courier & Postage", branch: "Nakuru", submittedBy: "John Kiprop", submittedDate: "2026-03-06", status: "rejected", approverComment: "Use internal mail service instead", approvedBy: "David Ochieng", approvedDate: "2026-03-06", receiptAttached: false },
  { id: "APR-006", expenseId: "EXP-111", description: "Emergency generator fuel", amount: 7200, category: "Utilities", branch: "Mombasa", submittedBy: "Ali Hassan", submittedDate: "2026-03-08", status: "pending", receiptAttached: true },
];

export interface Notification {
  id: string;
  type: "expense_submitted" | "expense_approved" | "expense_rejected" | "low_float" | "policy_update" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export const notifications: Notification[] = [
  { id: "N-001", type: "expense_submitted", title: "New Expense Submitted", message: "Grace Wanjiku submitted EXP-102 (KES 8,500) for Transport", timestamp: "2026-03-08 14:32", read: false, link: "/approvals" },
  { id: "N-002", type: "low_float", title: "Low Float Alert", message: "Nairobi CBD branch float is below 20% — KES 80,000 remaining", timestamp: "2026-03-08 11:15", read: false, link: "/floats" },
  { id: "N-003", type: "expense_submitted", title: "New Expense Submitted", message: "Ali Hassan submitted EXP-111 (KES 7,200) for Utilities", timestamp: "2026-03-08 10:45", read: false, link: "/approvals" },
  { id: "N-004", type: "expense_approved", title: "Expense Approved", message: "Your expense EXP-099 (KES 3,500) has been approved by Grace Wanjiku", timestamp: "2026-03-05 16:20", read: true },
  { id: "N-005", type: "expense_rejected", title: "Expense Rejected", message: "EXP-106 (KES 1,500) rejected — Use internal mail service", timestamp: "2026-03-06 09:30", read: true },
  { id: "N-006", type: "policy_update", title: "Policy Updated", message: "Daily Expense Cap updated to KES 25,000 by Jane Kamau", timestamp: "2026-03-05 08:00", read: true, link: "/policies" },
  { id: "N-007", type: "low_float", title: "Float Exhausted", message: "Kisumu branch float is exhausted — KES 10,000 remaining", timestamp: "2026-03-04 15:10", read: true, link: "/floats" },
];

export interface AuditLogEntry {
  id: string;
  user: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
  severity: "info" | "warning" | "critical";
  ipAddress: string;
}

export const auditLogs: AuditLogEntry[] = [
  { id: "AUD-001", user: "David Ochieng", action: "Float Allocated", entity: "Float", entityId: "FLT-006", details: "KES 150,000 allocated to Thika branch", timestamp: "2026-03-08 14:32:15", severity: "info", ipAddress: "192.168.1.42" },
  { id: "AUD-002", user: "Grace Wanjiku", action: "Expense Submitted", entity: "Expense", entityId: "EXP-102", details: "KES 8,500 for Staff Transport — Nairobi CBD", timestamp: "2026-03-08 11:15:22", severity: "info", ipAddress: "192.168.1.55" },
  { id: "AUD-003", user: "System", action: "Low Float Alert Triggered", entity: "Float", entityId: "FLT-001", details: "Nairobi CBD below 20% threshold (16%)", timestamp: "2026-03-08 10:00:00", severity: "warning", ipAddress: "—" },
  { id: "AUD-004", user: "Jane Kamau", action: "Policy Updated", entity: "Policy", entityId: "POL-004", details: "Daily Expense Cap changed from KES 20,000 to KES 25,000", timestamp: "2026-03-05 08:45:10", severity: "info", ipAddress: "192.168.1.10" },
  { id: "AUD-005", user: "David Ochieng", action: "Expense Rejected", entity: "Expense", entityId: "EXP-106", details: "Rejected courier expense — use internal mail", timestamp: "2026-03-06 09:30:45", severity: "info", ipAddress: "192.168.1.42" },
  { id: "AUD-006", user: "Grace Wanjiku", action: "Expense Approved", entity: "Expense", entityId: "EXP-099", details: "Approved team lunch — KES 3,500", timestamp: "2026-03-05 16:20:30", severity: "info", ipAddress: "192.168.1.55" },
  { id: "AUD-007", user: "System", action: "Float Exhausted Alert", entity: "Float", entityId: "FLT-003", details: "Kisumu branch float critically low (4%)", timestamp: "2026-03-04 15:10:00", severity: "critical", ipAddress: "—" },
  { id: "AUD-008", user: "Peter Mwangi", action: "Expense Submitted", entity: "Expense", entityId: "EXP-104", details: "KES 12,000 for AC unit repair — Nairobi CBD", timestamp: "2026-03-07 09:15:00", severity: "info", ipAddress: "192.168.1.78" },
  { id: "AUD-009", user: "Jane Kamau", action: "User Role Updated", entity: "User", entityId: "USR-003", details: "Grace Wanjiku role changed to Branch Manager", timestamp: "2026-03-03 14:00:00", severity: "warning", ipAddress: "192.168.1.10" },
  { id: "AUD-010", user: "David Ochieng", action: "Float Top-Up", entity: "Float", entityId: "FLT-004", details: "KES 50,000 top-up to Nakuru branch", timestamp: "2026-03-06 11:22:18", severity: "info", ipAddress: "192.168.1.42" },
];

export const reportData = {
  expenseSummary: [
    { month: "Oct", submitted: 32, approved: 28, rejected: 4 },
    { month: "Nov", submitted: 28, approved: 24, rejected: 4 },
    { month: "Dec", submitted: 41, approved: 35, rejected: 6 },
    { month: "Jan", submitted: 35, approved: 30, rejected: 5 },
    { month: "Feb", submitted: 38, approved: 33, rejected: 5 },
    { month: "Mar", submitted: 22, approved: 18, rejected: 4 },
  ],
  branchComparison: [
    { branch: "Nairobi CBD", expenses: 420000, float: 500000 },
    { branch: "Mombasa", expenses: 180000, float: 350000 },
    { branch: "Kisumu", expenses: 240000, float: 250000 },
    { branch: "Nakuru", expenses: 120000, float: 200000 },
    { branch: "Eldoret", expenses: 160000, float: 180000 },
    { branch: "Thika", expenses: 30000, float: 150000 },
  ],
  floatUsage: [
    { name: "Used", value: 1150000 },
    { name: "Remaining", value: 480000 },
  ],
  categoryBreakdown: [
    { name: "Transport", value: 28 },
    { name: "Repairs", value: 22 },
    { name: "Office Supplies", value: 18 },
    { name: "Meals", value: 14 },
    { name: "Utilities", value: 10 },
    { name: "Other", value: 8 },
  ],
};