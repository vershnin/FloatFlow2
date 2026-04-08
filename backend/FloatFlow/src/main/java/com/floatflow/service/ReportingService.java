package com.floatflow.service;

import com.lowagie.text.Document;
import com.lowagie.text.DocumentException;
import com.lowagie.text.FontFactory;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Phrase;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.floatflow.dto.response.BranchReportResponse;
import com.floatflow.entity.Branch;
import com.floatflow.entity.ExpenseStatus;
import com.floatflow.entity.FloatStatus;
import com.floatflow.entity.FloatTransaction;
import com.floatflow.exception.ResourceNotFoundException;
import com.floatflow.repository.BranchRepository;
import com.floatflow.repository.ExpenseRepository;
import com.floatflow.repository.FloatRepository;
import com.floatflow.repository.FloatTransactionRepository;
import lombok.RequiredArgsConstructor;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.OutputStreamWriter;
import java.nio.charset.StandardCharsets;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Generates financial summary reports using aggregation queries.
 * Uses @Transactional(readOnly = true) for better performance on read queries.
 */
@Service
@RequiredArgsConstructor
public class ReportingService {

    private final BranchRepository branchRepository;
    private final ExpenseRepository expenseRepository;
    private final FloatRepository floatRepository;
    private final FloatTransactionRepository floatTransactionRepository;

    @Transactional(readOnly = true)
    public BranchReportResponse getBranchReport(Long branchId) {
        Branch branch = branchRepository.findById(branchId)
            .orElseThrow(() -> new ResourceNotFoundException("Branch not found: " + branchId));

        // Sum of all non-closed float allocations for this branch
        List<com.floatflow.entity.Float> activeFloats = floatRepository.findByBranchId(branchId).stream()
            .filter(f -> f.getStatus() == FloatStatus.ACTIVE || f.getStatus() == FloatStatus.EXHAUSTED)
            .collect(Collectors.toList());

        BigDecimal totalAllocated = activeFloats.stream()
            .map(this::sumAllocatedFunds)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal remainingBalance = activeFloats.stream()
            .map(com.floatflow.entity.Float::getCurrentBalance)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalApproved = Optional.ofNullable(expenseRepository.sumApprovedByBranch(branchId))
            .orElse(BigDecimal.ZERO);

        Long pendingCount = Optional.ofNullable(expenseRepository.countByBranchAndStatus(branchId, ExpenseStatus.PENDING))
            .orElse(0L);
        Long approvedCount = Optional.ofNullable(expenseRepository.countByBranchAndStatus(branchId, ExpenseStatus.APPROVED))
            .orElse(0L);
        Long rejectedCount = Optional.ofNullable(expenseRepository.countByBranchAndStatus(branchId, ExpenseStatus.REJECTED))
            .orElse(0L);

        return BranchReportResponse.builder()
            .branchId(branchId)
            .branchName(branch.getName())
            .totalFloatAllocated(totalAllocated)
            .totalExpensesApproved(totalApproved)
            .remainingFloat(remainingBalance)
            .pendingExpensesCount(pendingCount)
            .approvedExpensesCount(approvedCount)
            .rejectedExpensesCount(rejectedCount)
            .build();
    }

    private BigDecimal sumAllocatedFunds(com.floatflow.entity.Float floatAllocation) {
        return floatTransactionRepository.findByFloatAllocationIdOrderByCreatedAtDesc(floatAllocation.getId()).stream()
            .filter(tx -> isAllocationTransaction(tx, floatAllocation))
            .map(FloatTransaction::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private boolean isAllocationTransaction(FloatTransaction tx, com.floatflow.entity.Float floatAllocation) {
        return tx.getFloatAllocation() != null
            && tx.getFloatAllocation().getId().equals(floatAllocation.getId())
            && ("INITIAL_ALLOCATION".equals(tx.getType()) || "TOPUP".equals(tx.getType()));
    }

    @Transactional(readOnly = true)
    public List<BranchReportResponse> getSummaryReport() {
        return branchRepository.findAll().stream()
            .map(branch -> getBranchReport(branch.getId()))
            .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public byte[] exportSummaryCsv(Long selectedBranchId) {
        List<BranchReportResponse> summaryReport = getSummaryReport();
        BranchReportResponse selectedBranch = selectedBranchId != null ? getBranchReport(selectedBranchId) : null;
        ReportTotals totals = calculateTotals(summaryReport);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
             OutputStreamWriter writer = new OutputStreamWriter(outputStream, StandardCharsets.UTF_8);
             CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT)) {

            csvPrinter.printRecord("FloatFlow Reports Export");
            csvPrinter.printRecord("generatedAt", LocalDateTime.now());
            csvPrinter.println();
            csvPrinter.printRecord("Summary By Branch");
            csvPrinter.printRecord(
                    "branchId",
                    "branchName",
                    "totalFloatAllocated",
                    "totalExpensesApproved",
                    "remainingFloat",
                    "pendingExpensesCount",
                    "approvedExpensesCount",
                    "rejectedExpensesCount"
            );

            for (BranchReportResponse row : summaryReport) {
                csvPrinter.printRecord(
                        row.getBranchId(),
                        row.getBranchName(),
                        row.getTotalFloatAllocated(),
                        row.getTotalExpensesApproved(),
                        row.getRemainingFloat(),
                        row.getPendingExpensesCount(),
                        row.getApprovedExpensesCount(),
                        row.getRejectedExpensesCount()
                );
            }

            csvPrinter.println();
            csvPrinter.printRecord("Totals");
            csvPrinter.printRecord("metric", "value");
            csvPrinter.printRecord("totalFloatAllocated", totals.totalFloatAllocated());
            csvPrinter.printRecord("totalExpensesApproved", totals.totalExpensesApproved());
            csvPrinter.printRecord("remainingFloat", totals.remainingFloat());
            csvPrinter.printRecord("pendingExpensesCount", totals.pendingExpensesCount());
            csvPrinter.printRecord("approvedExpensesCount", totals.approvedExpensesCount());
            csvPrinter.printRecord("rejectedExpensesCount", totals.rejectedExpensesCount());

            if (selectedBranch != null) {
                csvPrinter.println();
                csvPrinter.printRecord("Selected Branch Detail");
                csvPrinter.printRecord("metric", "value");
                csvPrinter.printRecord("branchId", selectedBranch.getBranchId());
                csvPrinter.printRecord("branchName", selectedBranch.getBranchName());
                csvPrinter.printRecord("totalFloatAllocated", selectedBranch.getTotalFloatAllocated());
                csvPrinter.printRecord("totalExpensesApproved", selectedBranch.getTotalExpensesApproved());
                csvPrinter.printRecord("remainingFloat", selectedBranch.getRemainingFloat());
                csvPrinter.printRecord("pendingExpensesCount", selectedBranch.getPendingExpensesCount());
                csvPrinter.printRecord("approvedExpensesCount", selectedBranch.getApprovedExpensesCount());
                csvPrinter.printRecord("rejectedExpensesCount", selectedBranch.getRejectedExpensesCount());
            }

            csvPrinter.flush();
            return outputStream.toByteArray();
        } catch (IOException exception) {
            throw new IllegalStateException("Unable to export summary report as CSV", exception);
        }
    }

    @Transactional(readOnly = true)
    public byte[] exportSummaryPdf(Long selectedBranchId) {
        List<BranchReportResponse> summaryReport = getSummaryReport();
        BranchReportResponse selectedBranch = selectedBranchId != null ? getBranchReport(selectedBranchId) : null;
        ReportTotals totals = calculateTotals(summaryReport);

        try (ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {
            Document document = new Document(PageSize.A4, 36, 36, 36, 36);
            PdfWriter.getInstance(document, outputStream);
            document.open();

            document.add(new Paragraph("FloatFlow Report", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 16)));
            document.add(new Paragraph("Generated: " + LocalDateTime.now(), FontFactory.getFont(FontFactory.HELVETICA, 10)));
            document.add(new Paragraph(" "));

            PdfPTable table = new PdfPTable(6);
            table.setWidthPercentage(100);
            table.setWidths(new float[]{2.5f, 1.8f, 1.8f, 1.8f, 1.2f, 1.2f});

            addPdfHeaderCell(table, "Branch");
            addPdfHeaderCell(table, "Allocated");
            addPdfHeaderCell(table, "Approved");
            addPdfHeaderCell(table, "Remaining");
            addPdfHeaderCell(table, "Pending");
            addPdfHeaderCell(table, "Rejected");

            for (BranchReportResponse row : summaryReport) {
                table.addCell(row.getBranchName());
                table.addCell(row.getTotalFloatAllocated().toPlainString());
                table.addCell(row.getTotalExpensesApproved().toPlainString());
                table.addCell(row.getRemainingFloat().toPlainString());
                table.addCell(String.valueOf(row.getPendingExpensesCount()));
                table.addCell(String.valueOf(row.getRejectedExpensesCount()));
            }

            document.add(table);
            document.add(new Paragraph(" "));
            document.add(new Paragraph("Portfolio Totals", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
            document.add(new Paragraph("Total Float Allocated: KES " + totals.totalFloatAllocated()));
            document.add(new Paragraph("Approved Expenses: KES " + totals.totalExpensesApproved()));
            document.add(new Paragraph("Remaining Float: KES " + totals.remainingFloat()));
            document.add(new Paragraph("Pending Expenses Count: " + totals.pendingExpensesCount()));

            if (selectedBranch != null) {
                document.add(new Paragraph(" "));
                document.add(new Paragraph("Selected Branch Detail", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 12)));
                document.add(new Paragraph("Branch: " + selectedBranch.getBranchName()));
                document.add(new Paragraph("Allocated Float: KES " + selectedBranch.getTotalFloatAllocated()));
                document.add(new Paragraph("Approved Expenses: KES " + selectedBranch.getTotalExpensesApproved()));
                document.add(new Paragraph("Remaining Float: KES " + selectedBranch.getRemainingFloat()));
                document.add(new Paragraph(
                        "Counts -> Pending: " + selectedBranch.getPendingExpensesCount()
                                + ", Approved: " + selectedBranch.getApprovedExpensesCount()
                                + ", Rejected: " + selectedBranch.getRejectedExpensesCount()
                ));
            }

            document.close();
            return outputStream.toByteArray();
        } catch (DocumentException | IOException exception) {
            throw new IllegalStateException("Unable to export summary report as PDF", exception);
        }
    }

    private void addPdfHeaderCell(PdfPTable table, String value) {
        PdfPCell cell = new PdfPCell(new Phrase(value, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10)));
        table.addCell(cell);
    }

    private ReportTotals calculateTotals(List<BranchReportResponse> summaryReport) {
        BigDecimal totalFloatAllocated = summaryReport.stream()
                .map(BranchReportResponse::getTotalFloatAllocated)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalExpensesApproved = summaryReport.stream()
                .map(BranchReportResponse::getTotalExpensesApproved)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal remainingFloat = summaryReport.stream()
                .map(BranchReportResponse::getRemainingFloat)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        long pendingExpensesCount = summaryReport.stream()
                .mapToLong(BranchReportResponse::getPendingExpensesCount)
                .sum();
        long approvedExpensesCount = summaryReport.stream()
                .mapToLong(BranchReportResponse::getApprovedExpensesCount)
                .sum();
        long rejectedExpensesCount = summaryReport.stream()
                .mapToLong(BranchReportResponse::getRejectedExpensesCount)
                .sum();

        return new ReportTotals(
                totalFloatAllocated,
                totalExpensesApproved,
                remainingFloat,
                pendingExpensesCount,
                approvedExpensesCount,
                rejectedExpensesCount
        );
    }

    private record ReportTotals(
            BigDecimal totalFloatAllocated,
            BigDecimal totalExpensesApproved,
            BigDecimal remainingFloat,
            long pendingExpensesCount,
            long approvedExpensesCount,
            long rejectedExpensesCount
    ) {
    }
}
