package com.nhathuoc.pharmacy_backend.api;

import java.time.LocalDate;

public record MedicineResponse(
        String id,
        String name,
        String category,
        double price,
        int stock,
        LocalDate nearestExpiry
) {
}