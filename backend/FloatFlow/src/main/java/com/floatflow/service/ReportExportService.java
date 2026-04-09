package com.floatflow.service;

import com.floatflow.dto.response.BranchReportResponse;
import com.itextpdf.io.font.constants.StandardFonts;
import com.itextpdf.kernel.colors.ColorConstants;
import com.itextpdf.kernel.colors.DeviceRgb;
import com.itextpdf.kernel.font.PdfFont;
import com.itextpdf.kernel.font.PdfFontFactory;
import com.itextpdf.kernel.geom.PageSize;
import com.itextpdf.kernel.pdf.PdfDocument;
import com.itextpdf.kernel.pdf.PdfWriter;
import com.itextpdf.layout.Document;
import com.itextpdf.layout.borders.SolidBorder;
import com.itextpdf.layout.element.Cell;
import com.itextpdf.layout.element.Paragraph;
import com.itextpdf.layout.element.Table;
import com.itextpdf.layout.properties.TextAlignment;
import com.itextpdf.layout.properties.UnitValue;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.poi.ss.usermodel.BorderStyle;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.DataFormat;
import org.apache.poi.ss.usermodel.FillPatternType;
import org.apache.poi.ss.usermodel.Font;
import org.apache.poi.ss.usermodel.HorizontalAlignment;
import org.apache.poi.ss.usermodel.IndexedColors;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.VerticalAlignment;
import org.apache.poi.ss.util.CellRangeAddress;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * ReportExportService
 *
 * Generates downloadable financial reports in PDF and Excel formats.
 * Both formats replicate the branded design:
 *   - Teal header band
 *   - KPI summary row
 *   - Branch breakdown table with alternating rows
 *   - Footer with timestamp
 *
 * Called by ReportController on:
 *   GET /api/reports/export/pdf
 *   GET /api/reports/export/excel
 *   GET /api/reports/branch/{id}/export/pdf
 *   GET /api/reports/branch/{id}/export/excel
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ReportExportService {

    private final ReportingService reportingService;

    @Value("${floatflow.report.company-name:FloatFlow}")
    private String companyName;

    @Value("${floatflow.report.currency:KES}")
    private String currency;

    // ── Brand colours ──────────────────────────────────────────────────────────
    private static final DeviceRgb TEAL        = new DeviceRgb(15,  118, 110);
    private static final DeviceRgb TEAL_DARK   = new DeviceRgb(13,  79,  73);
    private static final DeviceRgb TEAL_LIGHT  = new DeviceRgb(204, 251, 241);
    private static final DeviceRgb SLATE       = new DeviceRgb(30,  41,  59);
    private static final DeviceRgb SLATE_MID   = new DeviceRgb(71,  85,  105);
    private static final DeviceRgb SLATE_LIGHT = new DeviceRgb(241, 245, 249);
    private static final DeviceRgb BORDER      = new DeviceRgb(226, 232, 240);

    // ── PDF ────────────────────────────────────────────────────────────────────

    public byte[] generateSummaryPdf() {
        List<BranchReportResponse> branches = reportingService.getSummaryReport();
        return buildPdf("All Branches — Financial Summary", branches);
    }

    public byte[] generateBranchPdf(Long branchId) {
        BranchReportResponse branch = reportingService.getBranchReport(branchId);
        return buildPdf(branch.getBranchName() + " — Branch Report", List.of(branch));
    }

    private byte[] buildPdf(String title, List<BranchReportResponse> branches) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            PdfWriter writer   = new PdfWriter(baos);
            PdfDocument pdf    = new PdfDocument(writer);
            Document doc       = new Document(pdf, PageSize.A4);
            doc.setMargins(0, 15, 20, 15);

            PdfFont bold    = PdfFontFactory.createFont(StandardFonts.HELVETICA_BOLD);
            PdfFont regular = PdfFontFactory.createFont(StandardFonts.HELVETICA);
            String ts       = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("dd MMM yyyy, HH:mm"));

            // ── Header band ────────────────────────────────────────────────────
            Table header = new Table(UnitValue.createPercentArray(new float[]{50, 50}))
                .useAllAvailableWidth()
                .setBackgroundColor(TEAL)
                .setPaddingTop(14).setPaddingBottom(14)
                .setPaddingLeft(10).setPaddingRight(10);

            header.addCell(new Cell().add(
                    new Paragraph(companyName)
                        .setFont(bold).setFontSize(20).setFontColor(ColorConstants.WHITE))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER));
            header.addCell(new Cell().add(
                    new Paragraph("Financial Summary Report\nGenerated: " + ts)
                        .setFont(regular).setFontSize(9).setFontColor(TEAL_LIGHT))
                .setBorder(com.itextpdf.layout.borders.Border.NO_BORDER)
                .setTextAlignment(TextAlignment.RIGHT));
            doc.add(header);

            // ── Portfolio totals ───────────────────────────────────────────────
            BigDecimal totAllocated = branches.stream()
                .map(BranchReportResponse::getTotalFloatAllocated)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totApproved = branches.stream()
                .map(BranchReportResponse::getTotalExpensesApproved)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            BigDecimal totRemaining = branches.stream()
                .map(BranchReportResponse::getRemainingFloat)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            long totPending = branches.stream()
                .mapToLong(BranchReportResponse::getPendingExpensesCount).sum();

            doc.add(new Paragraph("\nPortfolio Totals").setFont(bold)
                .setFontSize(11).setFontColor(SLATE).setMarginLeft(10));

            Table kpi = new Table(UnitValue.createPercentArray(new float[]{25, 25, 25, 25}))
                .useAllAvailableWidth()
                .setMarginLeft(10).setMarginRight(10).setMarginBottom(10);
            addKpiCell(kpi, bold, regular, "Total Float Allocated",
                currency + " " + fmt(totAllocated));
            addKpiCell(kpi, bold, regular, "Approved Expenses",
                currency + " " + fmt(totApproved));
            addKpiCell(kpi, bold, regular, "Remaining Float",
                currency + " " + fmt(totRemaining));
            addKpiCell(kpi, bold, regular, "Pending Expenses", String.valueOf(totPending));
            doc.add(kpi);

            // ── Branch table ───────────────────────────────────────────────────
            doc.add(new Paragraph("Branch Breakdown").setFont(bold)
                .setFontSize(11).setFontColor(SLATE).setMarginLeft(10));

            String[] headers = {"Branch", "Allocated (" + currency + ")",
                "Approved (" + currency + ")", "Remaining (" + currency + ")",
                "Pending", "Rejected"};
            float[] widths = {30, 17, 17, 18, 9, 9};
            Table table = new Table(UnitValue.createPercentArray(widths))
                .useAllAvailableWidth()
                .setMarginLeft(10).setMarginRight(10);

            // header row
            for (String h : headers) {
                table.addHeaderCell(new Cell().add(new Paragraph(h).setFont(bold).setFontSize(8))
                    .setBackgroundColor(TEAL).setFontColor(ColorConstants.WHITE)
                    .setPadding(6).setTextAlignment(TextAlignment.CENTER)
                    .setBorder(new SolidBorder(TEAL_DARK, 1)));
            }

            // data rows
            boolean alt = false;
            for (BranchReportResponse b : branches) {
                DeviceRgb rowBg = alt ? SLATE_LIGHT : new DeviceRgb(255, 255, 255);
                addTableRow(table, regular, rowBg,
                    b.getBranchName(),
                    fmt(b.getTotalFloatAllocated()),
                    fmt(b.getTotalExpensesApproved()),
                    fmt(b.getRemainingFloat()),
                    String.valueOf(b.getPendingExpensesCount()),
                    String.valueOf(b.getRejectedExpensesCount())
                );
                alt = !alt;
            }
            doc.add(table);

            // ── Footer ─────────────────────────────────────────────────────────
            doc.add(new Paragraph("\n" + companyName +
                "  •  Confidential  •  Generated " + ts)
                .setFont(regular).setFontSize(7).setFontColor(SLATE_MID)
                .setTextAlignment(TextAlignment.CENTER));

            doc.close();
        } catch (Exception e) {
            log.error("PDF generation failed: {}", e.getMessage(), e);
            throw new RuntimeException("PDF generation failed", e);
        }
        return baos.toByteArray();
    }

    // ── Excel ──────────────────────────────────────────────────────────────────

    public byte[] generateSummaryExcel() {
        List<BranchReportResponse> branches = reportingService.getSummaryReport();
        return buildExcel("Summary Report", branches);
    }

    public byte[] generateBranchExcel(Long branchId) {
        BranchReportResponse branch = reportingService.getBranchReport(branchId);
        return buildExcel(branch.getBranchName(), List.of(branch));
    }

    private byte[] buildExcel(String sheetTitle, List<BranchReportResponse> branches) {
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (XSSFWorkbook wb = new XSSFWorkbook()) {
            Sheet sheet = wb.createSheet("FloatFlow Report");
            String ts = LocalDateTime.now()
                .format(DateTimeFormatter.ofPattern("dd MMM yyyy HH:mm"));

            // ── Cell styles ────────────────────────────────────────────────────
            CellStyle titleStyle  = excelStyle(wb, "0F766E", true,  14, true);
            CellStyle headerStyle = excelStyle(wb, "0F766E", true,  9,  true);
            CellStyle kpiStyle    = excelStyle(wb, "CCFBF1", true,  10, false);
            CellStyle dataStyle   = excelStyle(wb, "FFFFFF", false, 9,  false);
            CellStyle altStyle    = excelStyle(wb, "F1F5F9", false, 9,  false);
            CellStyle totalStyle  = excelStyle(wb, "0D4F49", true,  9,  true);

            // Number format
            DataFormat fmt = wb.createDataFormat();
            short numFmt   = fmt.getFormat("#,##0.00");
            kpiStyle.setDataFormat(numFmt);
            dataStyle.setDataFormat(numFmt);
            altStyle.setDataFormat(numFmt);
            totalStyle.setDataFormat(numFmt);

            int r = 0;

            // Title
            Row titleRow = sheet.createRow(r++);
            titleRow.setHeightInPoints(28);
            var t = titleRow.createCell(0);
            t.setCellValue(companyName + " — " + sheetTitle);
            t.setCellStyle(titleStyle);
            sheet.addMergedRegion(new CellRangeAddress(0, 0, 0, 6));

            // Timestamp
            Row tsRow = sheet.createRow(r++);
            tsRow.createCell(0).setCellValue("Generated: " + ts);
            sheet.addMergedRegion(new CellRangeAddress(1, 1, 0, 6));
            r++;

            // KPI row
            Row kpiLabelRow = sheet.createRow(r++);
            Row kpiValueRow = sheet.createRow(r++);
            String[] kpiLabels = {"Total Float Allocated", "Approved Expenses",
                "Remaining Float", "Pending Expenses"};
            BigDecimal[] kpiValues = {
                sum(branches, BranchReportResponse::getTotalFloatAllocated),
                sum(branches, BranchReportResponse::getTotalExpensesApproved),
                sum(branches, BranchReportResponse::getRemainingFloat),
                BigDecimal.valueOf(branches.stream()
                    .mapToLong(BranchReportResponse::getPendingExpensesCount).sum())
            };
            for (int i = 0; i < kpiLabels.length; i++) {
                var lc = kpiLabelRow.createCell(i + 1);
                lc.setCellValue(kpiLabels[i]);
                lc.setCellStyle(headerStyle);
                var vc = kpiValueRow.createCell(i + 1);
                vc.setCellValue(kpiValues[i].doubleValue());
                vc.setCellStyle(kpiStyle);
            }
            r++;

            // Column headers
            Row headRow = sheet.createRow(r++);
            String[] cols = {"Branch", "Allocated (" + currency + ")",
                "Approved (" + currency + ")", "Remaining (" + currency + ")",
                "Pending", "Approved Count", "Rejected"};
            for (int i = 0; i < cols.length; i++) {
                var c = headRow.createCell(i);
                c.setCellValue(cols[i]);
                c.setCellStyle(headerStyle);
            }

            // Data rows
            boolean alt = false;
            for (BranchReportResponse b : branches) {
                Row row = sheet.createRow(r++);
                CellStyle cs = alt ? altStyle : dataStyle;
                row.createCell(0).setCellValue(b.getBranchName());
                row.createCell(1).setCellValue(b.getTotalFloatAllocated().doubleValue());
                row.createCell(2).setCellValue(b.getTotalExpensesApproved().doubleValue());
                row.createCell(3).setCellValue(b.getRemainingFloat().doubleValue());
                row.createCell(4).setCellValue(b.getPendingExpensesCount());
                row.createCell(5).setCellValue(b.getApprovedExpensesCount());
                row.createCell(6).setCellValue(b.getRejectedExpensesCount());
                for (int i = 0; i < 7; i++) {
                    if (row.getCell(i) != null) row.getCell(i).setCellStyle(cs);
                }
                row.getCell(0).setCellStyle(dataStyle); // branch name left-aligned
                alt = !alt;
            }

            // Totals row
            Row totRow = sheet.createRow(r);
            totRow.createCell(0).setCellValue("TOTAL");
            totRow.createCell(1).setCellValue(
                sum(branches, BranchReportResponse::getTotalFloatAllocated).doubleValue());
            totRow.createCell(2).setCellValue(
                sum(branches, BranchReportResponse::getTotalExpensesApproved).doubleValue());
            totRow.createCell(3).setCellValue(
                sum(branches, BranchReportResponse::getRemainingFloat).doubleValue());
            totRow.createCell(4).setCellValue(
                branches.stream().mapToLong(BranchReportResponse::getPendingExpensesCount).sum());
            totRow.createCell(5).setCellValue(
                branches.stream().mapToLong(BranchReportResponse::getApprovedExpensesCount).sum());
            totRow.createCell(6).setCellValue(
                branches.stream().mapToLong(BranchReportResponse::getRejectedExpensesCount).sum());
            for (int i = 0; i < 7; i++) {
                if (totRow.getCell(i) != null) totRow.getCell(i).setCellStyle(totalStyle);
            }

            // Column widths
            int[] colWidths = {6000, 5000, 5000, 5000, 3000, 4000, 3000};
            for (int i = 0; i < colWidths.length; i++) sheet.setColumnWidth(i, colWidths[i]);

            wb.write(baos);
        } catch (Exception e) {
            log.error("Excel generation failed: {}", e.getMessage(), e);
            throw new RuntimeException("Excel generation failed", e);
        }
        return baos.toByteArray();
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private void addKpiCell(Table t, PdfFont bold, PdfFont reg, String label, String value) {
        t.addCell(new Cell()
            .add(new Paragraph(label).setFont(reg).setFontSize(7).setFontColor(SLATE_MID)
                .setTextAlignment(TextAlignment.CENTER))
            .add(new Paragraph(value).setFont(bold).setFontSize(14).setFontColor(TEAL_DARK)
                .setTextAlignment(TextAlignment.CENTER))
            .setBackgroundColor(TEAL_LIGHT).setPadding(8)
            .setBorder(new SolidBorder(BORDER, 0.5f)));
    }

    private void addTableRow(Table t, PdfFont font, DeviceRgb bg, String... cells) {
        boolean first = true;
        for (String val : cells) {
            TextAlignment align = first ? TextAlignment.LEFT : TextAlignment.CENTER;
            t.addCell(new Cell()
                .add(new Paragraph(val).setFont(font).setFontSize(8))
                .setBackgroundColor(bg).setPadding(5)
                .setTextAlignment(align)
                .setBorder(new SolidBorder(BORDER, 0.3f)));
            first = false;
        }
    }

    private CellStyle excelStyle(XSSFWorkbook wb, String hexColor,
                                  boolean bold, int fontSize, boolean white) {
        CellStyle cs = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(bold);
        font.setFontHeightInPoints((short) fontSize);
        if (white) font.setColor(IndexedColors.WHITE.getIndex());
        cs.setFont(font);
        cs.setAlignment(HorizontalAlignment.CENTER);
        cs.setVerticalAlignment(VerticalAlignment.CENTER);
        cs.setBorderBottom(BorderStyle.THIN);
        cs.setBorderTop(BorderStyle.THIN);
        cs.setBorderLeft(BorderStyle.THIN);
        cs.setBorderRight(BorderStyle.THIN);
        cs.setBottomBorderColor(IndexedColors.GREY_25_PERCENT.getIndex());
        cs.setFillForegroundColor(new org.apache.poi.xssf.usermodel.XSSFColor(
            hexToBytes(hexColor), null));
        cs.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return cs;
    }

    private byte[] hexToBytes(String hex) {
        return new byte[]{
            (byte) Integer.parseInt(hex.substring(0, 2), 16),
            (byte) Integer.parseInt(hex.substring(2, 4), 16),
            (byte) Integer.parseInt(hex.substring(4, 6), 16)
        };
    }

    private String fmt(BigDecimal v) {
        if (v == null) return "0.00";
        return String.format("%,.2f", v);
    }

    private BigDecimal sum(List<BranchReportResponse> list,
                           java.util.function.Function<BranchReportResponse, BigDecimal> getter) {
        return list.stream().map(getter)
            .filter(v -> v != null)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
