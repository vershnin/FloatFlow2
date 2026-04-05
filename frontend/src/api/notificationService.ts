import apiClient from "./apiClient";

export interface Notification {
  id: string;
  type: "expense_submitted" | "expense_approved" | "expense_rejected" | "low_float" | "policy_update" | "system";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  link?: string;
}

export interface NotificationPage {
  items: Notification[];
  page: number;
  size: number;
  total: number;
}

export const getNotifications = async (page = 1, size = 20): Promise<Notification[]> => {
  const res = await apiClient.get(`/notifications?page=${page}&size=${size}`);
  // Support raw arrays, wrapped arrays, and paginated payloads.
  const payload = res.data?.data ?? res.data;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(res.data?.items)) return res.data.items;
  return [];
};

export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await apiClient.put(`/notifications/${notificationId}/read`);
};

export const markAllNotificationsRead = async (): Promise<void> => {
  await apiClient.put(`/notifications/read-all`);
};

export const getUnreadNotificationCount = async (): Promise<number> => {
  const res = await apiClient.get(`/notifications/unread-count`);
  return res.data?.data?.count ?? res.data?.count ?? 0;
};
