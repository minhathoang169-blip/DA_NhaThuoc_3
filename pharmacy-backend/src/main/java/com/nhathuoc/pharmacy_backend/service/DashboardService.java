package com.nhathuoc.pharmacy_backend.service;

import com.nhathuoc.pharmacy_backend.dto.DashboardMetricsResponse;
import com.nhathuoc.pharmacy_backend.dto.DashboardOverviewResponse;
import com.nhathuoc.pharmacy_backend.dto.ExpiringBatchResponse;
import com.nhathuoc.pharmacy_backend.entity.Medicine;
import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import com.nhathuoc.pharmacy_backend.repository.InvoiceRepository;
import com.nhathuoc.pharmacy_backend.repository.MedicineBatchRepository;
import com.nhathuoc.pharmacy_backend.repository.MedicineRepository;
import com.nhathuoc.pharmacy_backend.repository.OnlineOrderRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class DashboardService {

    private final InvoiceRepository invoiceRepository;
    private final OnlineOrderRepository onlineOrderRepository;
    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository batchRepository;

    public DashboardService(InvoiceRepository invoiceRepository,
                            OnlineOrderRepository onlineOrderRepository,
                            MedicineRepository medicineRepository,
                            MedicineBatchRepository batchRepository) {
        this.invoiceRepository = invoiceRepository;
        this.onlineOrderRepository = onlineOrderRepository;
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
    }

    /**
     * Báo cáo Tổng quan Dashboard nâng cao: Phân định rõ doanh thu Quầy và App di động
     */
    @Transactional(readOnly = true)
    public DashboardOverviewResponse getOverview() {
        LocalDate today = LocalDate.now();

        Double posRevenue = invoiceRepository.sumTotalRevenue();
        if (posRevenue == null) posRevenue = 0.0;

        Double appRevenue = onlineOrderRepository.sumTotalRevenue();
        if (appRevenue == null) appRevenue = 0.0;

        double totalRevenue = posRevenue + appRevenue;

        double posPct = totalRevenue > 0 ? Math.round((posRevenue / totalRevenue) * 1000.0) / 10.0 : 0.0;
        double appPct = totalRevenue > 0 ? Math.round((appRevenue / totalRevenue) * 1000.0) / 10.0 : 0.0;

        long posOrdersCount = invoiceRepository.count();
        long appOrdersCount = onlineOrderRepository.count();
        long totalOrdersCount = posOrdersCount + appOrdersCount;

        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.atTime(LocalTime.MAX);
        Double shiftRev = invoiceRepository.sumRevenueBetween(startOfToday, endOfToday);
        if (shiftRev == null) shiftRev = 0.0;

        Double todayAppRev = onlineOrderRepository.sumRevenueBetween(startOfToday, endOfToday);
        if (todayAppRev == null) todayAppRev = 0.0;

        // Đếm thuốc sắp hết hàng (< 20)
        List<Medicine> medicines = medicineRepository.findAll();
        long lowStockCount = 0;
        for (Medicine m : medicines) {
            int stock = batchRepository.getAvailableStockForMedicine(m.getId(), today);
            if (stock < 20) {
                lowStockCount++;
            }
        }

        // Đếm số lô cận hạn
        long criticalBatchesCount = batchRepository.countExpiringBatches(today, today.plusDays(15));
        long expiringBatchesCount = batchRepository.countExpiringBatches(today, today.plusDays(30));

        // Biểu đồ 7 ngày gần nhất (tổng hợp quầy + app)
        List<DashboardMetricsResponse.DailyRevenueDto> chart = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);

            Double posDay = invoiceRepository.sumRevenueBetween(start, end);
            Double appDay = onlineOrderRepository.sumRevenueBetween(start, end);
            double dayTotal = (posDay != null ? posDay : 0.0) + (appDay != null ? appDay : 0.0);

            long posCount = invoiceRepository.countBySaleDateBetween(start, end);
            long appCount = onlineOrderRepository.countByOrderDateBetween(start, end);

            chart.add(new DashboardMetricsResponse.DailyRevenueDto(
                    date.toString(),
                    dayTotal,
                    posCount + appCount
            ));
        }

        Map<String, Object[]> salesByMedicine = new HashMap<>();
        addSalesTotals(salesByMedicine, invoiceRepository.findTopSellingMedicineTotals());
        addSalesTotals(salesByMedicine, onlineOrderRepository.findTopSellingMedicineTotals());

        List<Object[]> rankedSales = salesByMedicine.values().stream()
                .sorted(Comparator.comparingLong((Object[] row) -> ((Number) row[3]).longValue()).reversed())
                .limit(5)
                .toList();
        List<DashboardOverviewResponse.TopSellingMedicineDto> topSelling = new ArrayList<>();
        for (int index = 0; index < rankedSales.size(); index++) {
            Object[] row = rankedSales.get(index);
            String medicineId = (String) row[0];
            String medicineName = (String) row[1];
            int quantitySold = ((Number) row[3]).intValue();
            double revenue = ((Number) row[4]).doubleValue();
            int stock = batchRepository.getAvailableStockForMedicine(medicineId, today);
            String status = stock >= 20 ? "SAFE" : (stock >= 10 ? "WARNING" : "CRITICAL");
            String unit = medicineName.contains("Lọ") ? "Lọ" : (medicineName.contains("Tuýp") ? "Tuýp" : (medicineName.contains("vỉ") ? "Vỉ" : "Hộp"));
            double percentage = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 1000.0) / 10.0 : 0.0;
            topSelling.add(new DashboardOverviewResponse.TopSellingMedicineDto(
                    index + 1, medicineId, medicineName, (String) row[2], quantitySold,
                    unit, revenue, percentage, stock, status
            ));
        }

        return new DashboardOverviewResponse(
                posRevenue,
                appRevenue,
                totalRevenue,
                posPct,
                appPct,
                posOrdersCount,
                appOrdersCount,
                totalOrdersCount,
                lowStockCount,
                expiringBatchesCount,
                criticalBatchesCount,
                shiftRev,
                todayAppRev,
                chart,
                topSelling
        );
    }

    private void addSalesTotals(Map<String, Object[]> totals, List<Object[]> rows) {
        for (Object[] row : rows) {
            String medicineId = (String) row[0];
            Object[] current = totals.get(medicineId);
            if (current == null) {
                totals.put(medicineId, new Object[]{row[0], row[1], row[2], ((Number) row[3]).longValue(), ((Number) row[4]).doubleValue()});
            } else {
                current[3] = ((Number) current[3]).longValue() + ((Number) row[3]).longValue();
                current[4] = ((Number) current[4]).doubleValue() + ((Number) row[4]).doubleValue();
            }
        }
    }

    @Transactional(readOnly = true)
    public DashboardMetricsResponse getMetrics() {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfToday = today.atStartOfDay();
        LocalDateTime endOfToday = today.atTime(LocalTime.MAX);

        Double totalRevenue = invoiceRepository.sumTotalRevenue();
        if (totalRevenue == null) totalRevenue = 0.0;

        long totalOrders = invoiceRepository.count();

        Double todayRevenue = invoiceRepository.sumRevenueBetween(startOfToday, endOfToday);
        if (todayRevenue == null) todayRevenue = 0.0;

        long todayOrders = invoiceRepository.countBySaleDateBetween(startOfToday, endOfToday);

        List<Medicine> medicines = medicineRepository.findAll();
        long lowStockCount = 0;
        for (Medicine m : medicines) {
            int stock = batchRepository.getAvailableStockForMedicine(m.getId(), today);
            if (stock < 20) {
                lowStockCount++;
            }
        }

        LocalDate thirtyDaysLater = today.plusDays(30);
        long expiringBatchesCount = batchRepository.countExpiringBatches(today, thirtyDaysLater);

        List<DashboardMetricsResponse.DailyRevenueDto> chart = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = today.minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.atTime(LocalTime.MAX);

            Double rev = invoiceRepository.sumRevenueBetween(start, end);
            long count = invoiceRepository.countBySaleDateBetween(start, end);

            chart.add(new DashboardMetricsResponse.DailyRevenueDto(
                    date.toString(),
                    rev != null ? rev : 0.0,
                    count
            ));
        }

        return new DashboardMetricsResponse(
                totalRevenue,
                totalOrders,
                lowStockCount,
                expiringBatchesCount,
                todayRevenue,
                todayOrders,
                chart
        );
    }

    @Transactional(readOnly = true)
    public List<ExpiringBatchResponse> getExpiringBatches(int days) {
        if (days <= 0) days = 30;
        LocalDate today = LocalDate.now();
        LocalDate targetDate = today.plusDays(days);

        List<MedicineBatch> batches = batchRepository.findExpiringBatches(today, targetDate);

        return batches.stream().map(b -> {
            long daysRemaining = ChronoUnit.DAYS.between(today, b.getExpiryDate());
            String alertLevel;
            if (daysRemaining <= 15) {
                alertLevel = "CRITICAL";
            } else if (daysRemaining <= 30) {
                alertLevel = "WARNING";
            } else {
                alertLevel = "SAFE";
            }

            return new ExpiringBatchResponse(
                    b.getId(),
                    b.getBatchNumber(),
                    b.getMedicine().getId(),
                    b.getMedicine().getName(),
                    b.getQuantity(),
                    b.getExpiryDate(),
                    daysRemaining,
                    alertLevel
            );
        }).toList();
    }
}
