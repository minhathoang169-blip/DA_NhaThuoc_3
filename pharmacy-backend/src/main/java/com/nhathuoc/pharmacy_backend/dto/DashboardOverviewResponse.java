package com.nhathuoc.pharmacy_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardOverviewResponse {
    private double posRevenue;
    private double appRevenue;
    private double totalRevenue;
    private double posPercentage;
    private double appPercentage;
    private long posOrdersCount;
    private long appOrdersCount;
    private long totalOrdersCount;
    private long lowStockCount;
    private long expiringBatchesCount;
    private long criticalBatchesCount;
    private double shiftRevenue;
    private double todayAppRevenue;
    private List<DashboardMetricsResponse.DailyRevenueDto> dailyRevenue;
    private List<TopSellingMedicineDto> topSellingMedicines;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class TopSellingMedicineDto {
        private int rank;
        private String medicineId;
        private String medicineName;
        private String activeIngredient;
        private int quantitySold;
        private String unit;
        private double revenue;
        private double percentage;
        private int availableStock;
        private String safetyStatus; // SAFE, WARNING, CRITICAL
    }
}
