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

export const downloadSummaryReportCsv = async (selectedBranchId?: number): Promise<void> => {
  const query = selectedBranchId ? `?selectedBranchId=${selectedBranchId}` : "";
  const res = await apiClient.get(`/reports/summary/export/csv${query}`, {
    responseType: "blob",
  });
  const fileName = getFileNameFromDisposition(res.headers["content-disposition"], "floatflow-reports.csv");
  triggerDownload(res.data, fileName);
};

export const downloadSummaryReportPdf = async (selectedBranchId?: number): Promise<void> => {
  const query = selectedBranchId ? `?selectedBranchId=${selectedBranchId}` : "";
  const res = await apiClient.get(`/reports/summary/export/pdf${query}`, {
    responseType: "blob",
  });
  const fileName = getFileNameFromDisposition(res.headers["content-disposition"], "floatflow-reports.pdf");
  triggerDownload(res.data, fileName);
};
