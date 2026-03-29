import apiClient from "./apiClient";

export interface AuditLogResponse {
  id: number;
  userId: number;
  action: string;
  entityType: string;
  entityId: number;
  details?: string;
  checksum: string;
  createdAt: string;
}

export const getAuditLogs = async (): Promise<AuditLogResponse[]> => {
  const res = await apiClient.get("/audit");
  return res.data.data;
};

export const getAuditLogsByEntity = async (
  entityType: string,
  entityId: number
): Promise<AuditLogResponse[]> => {
  const res = await apiClient.get(`/audit?entityType=${entityType}&entityId=${entityId}`);
  return res.data.data;
};
