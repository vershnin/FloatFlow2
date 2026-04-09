import apiClient from "./apiClient";

export interface BranchReport {
  branchId: number;
  branchName: string;
  totalFloatAllocated: number;
  totalExpensesApproved: number;
  remainingFloat: number;
  pendingExpensesCount: number;
  approvedExpensesCount: number;
  rejectedExpensesCount: number;
}

export const getSummaryReport = async (): Promise<BranchReport[]> => {
  const res = await apiClient.get("/reports/summary");
  return res.data.data;
};

export const getBranchReport = async (branchId: number): Promise<BranchReport> => {
  const res = await apiClient.get(`/reports/branch/${branchId}`);
  return res.data.data;
};

function getFileNameFromDisposition(disposition?: string, fallback = "report") {
  const match = disposition?.match(/filename=\"?([^\";]+)\"?/i);
  return match?.[1] ?? fallback;
}

function triggerDownload(blob: Blob, fileName: string) {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

export const downloadSummaryReportExcel = async (branchId?: number): Promise<void> => {
  const url = branchId ? `/reports/branch/${branchId}/export/excel` : "/reports/export/excel";
  const res = await apiClient.get(url, { responseType: "blob" });
  const fileName = getFileNameFromDisposition(res.headers["content-disposition"], "floatflow-summary-report.xlsx");
  triggerDownload(res.data, fileName);
};

export const downloadSummaryReportPdf = async (branchId?: number): Promise<void> => {
  const url = branchId ? `/reports/branch/${branchId}/export/pdf` : "/reports/export/pdf";
  const res = await apiClient.get(url, { responseType: "blob" });
  const fileName = getFileNameFromDisposition(res.headers["content-disposition"], "floatflow-summary-report.pdf");
  triggerDownload(res.data, fileName);
};
