package com.nhathuoc.pharmacy_backend.api;

import java.time.LocalDate;
import java.util.List;

public record SaleRequest(String id, String customerId, String employeeId, LocalDate transactionDate, List<Line> lines) {
    public record Line(String batchId, Integer quantity, Double unitPrice) {}
}
