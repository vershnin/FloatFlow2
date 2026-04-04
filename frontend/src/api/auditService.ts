import apiClient from "./apiClient";

export interface AuditLogResponse {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: number;
  details?: string;
  checksum: string;
  ipAddress: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  createdAt: string;
}

export interface AuditLogPageResponse {
  content: AuditLogResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export const getAuditLogs = async (params?: {
  page?: number;
  size?: number;
  entityType?: string;
  entityId?: number;
  userId?: number;
  severity?: string;
  dateFrom?: string;
  dateTo?: string;
}): Promise<AuditLogPageResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page !== undefined) queryParams.append('page', params.page.toString());
  if (params?.size !== undefined) queryParams.append('size', params.size.toString());
  if (params?.entityType) queryParams.append('entityType', params.entityType);
  if (params?.entityId !== undefined) queryParams.append('entityId', params.entityId.toString());
  if (params?.userId !== undefined) queryParams.append('userId', params.userId.toString());
  if (params?.severity) queryParams.append('severity', params.severity);
  if (params?.dateFrom) queryParams.append('dateFrom', params.dateFrom);
  if (params?.dateTo) queryParams.append('dateTo', params.dateTo);

  const res = await apiClient.get(`/audit?${queryParams.toString()}`);
  return res.data.data;
};

export const getAuditLogsByEntity = async (
  entityType: string,
  entityId: number
): Promise<AuditLogResponse[]> => {
  const res = await apiClient.get(`/audit?entityType=${entityType}&entityId=${entityId}`);
  return res.data.data;
};
