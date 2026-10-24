package com.nhathuoc.pharmacy_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class DashboardMetricsResponse {
    private double totalRevenue;
    private long totalOrders;
    private long lowStockCount;
    private long expiringBatchesCount;
    private double todayRevenue;
    private long todayOrders;
    private List<DailyRevenueDto> revenueChart;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    public static class DailyRevenueDto {
        private String date;
        private double revenue;
        private long orderCount;
    }
}
