package com.nhathuoc.pharmacy_backend.api;

import java.time.LocalDate;

public record MedicineBatchRequest(
        String id,
        String medicineId,
        Integer batchNumber,
        LocalDate expiryDate,
        Integer quantity,
        Double purchasePrice
) {
}