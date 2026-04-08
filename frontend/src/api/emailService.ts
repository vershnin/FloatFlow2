import apiClient from "./apiClient";
import type { ExpenseResponse } from "./expenseService";

export interface EmailResult {
  delivered: boolean;
  queued: boolean;
  message: string;
}

interface DecisionEmailPayload {
  expenseId: number;
  status: "APPROVED" | "REJECTED";
  reviewerName: string;
  reviewerEmail: string;
  comment?: string;
  submittedByName: string;
  submittedByEmail: string;
  amount: number;
  branchName: string;
  category: string;
  description: string;
}

interface ReminderPayload {
  requestedByName: string;
  requestedByEmail: string;
  pendingCount: number;
  expenses: Array<{
    id: number;
    submittedByName: string;
    submittedByEmail: string;
    amount: number;
    branchName: string;
    createdAt: string;
  }>;
}

function queueEmailLocally(type: string, payload: unknown) {
  const key = "ff_email_outbox";
  const existing = localStorage.getItem(key);
  const items = existing ? JSON.parse(existing) : [];
  items.unshift({
    id: `local-${Date.now()}`,
    type,
    payload,
    queuedAt: new Date().toISOString(),
  });
  localStorage.setItem(key, JSON.stringify(items.slice(0, 100)));
}

function normalizeEmailResult(data: Partial<EmailResult> | undefined, fallbackMessage: string): EmailResult {
  return {
    delivered: data?.delivered ?? false,
    queued: data?.queued ?? true,
    message: data?.message ?? fallbackMessage,
  };
}

export async function sendExpenseDecisionEmail(payload: DecisionEmailPayload): Promise<EmailResult> {
  try {
    const response = await apiClient.post("/notifications/email/expense-decision", payload);
    return normalizeEmailResult(response.data?.data, "Expense decision email processed");
  } catch {
    queueEmailLocally("expense_decision", payload);
    return {
      delivered: false,
      queued: true,
      message: "Email queued locally because backend email processing is unavailable",
    };
  }
}

export async function sendPendingApprovalReminderEmails(
  expenses: ExpenseResponse[],
  requestedByName: string,
  requestedByEmail: string
): Promise<EmailResult> {
  const payload: ReminderPayload = {
    requestedByName,
    requestedByEmail,
    pendingCount: expenses.length,
    expenses: expenses.map((expense) => ({
      id: expense.id,
      submittedByName: expense.submittedByName,
      submittedByEmail: expense.submittedByEmail,
      amount: expense.amount,
      branchName: expense.branchName,
      createdAt: expense.createdAt,
    })),
  };

  try {
    const response = await apiClient.post("/notifications/email/pending-approval-reminders", payload);
    return normalizeEmailResult(response.data?.data, "Pending approval reminders processed");
  } catch {
    queueEmailLocally("approval_reminder", payload);
    return {
      delivered: false,
      queued: true,
      message: "Reminder emails queued locally because backend email processing is unavailable",
    };
  }
}
