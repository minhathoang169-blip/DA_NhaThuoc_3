package com.nhathuoc.pharmacy_backend.api;

import java.time.LocalDate;
import java.util.List;

public record TransactionResponse(
        String id, String partnerName, String employeeName, LocalDate transactionDate,
        double totalAmount, List<Line> lines
) {
    public record Line(String batchId, String medicineName, int quantity, double unitPrice, double total) {}
}
