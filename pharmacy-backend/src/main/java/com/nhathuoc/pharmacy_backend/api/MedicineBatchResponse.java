package com.nhathuoc.pharmacy_backend.api;

import java.time.LocalDate;

public record MedicineBatchResponse(
        String id,
        String medicineId,
        String medicineName,
        int batchNumber,
        LocalDate expiryDate,
        int quantity,
        double purchasePrice
) {
}