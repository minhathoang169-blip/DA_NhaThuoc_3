package com.nhathuoc.pharmacy_backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchDetailResponse {
    private String id;
    private int batchNumber;
    private String medicineId;
    private String medicineName;
    private String category;
    private int quantity;
    private double costPrice;
    private LocalDate expiryDate;
    private long daysRemaining;
    private String alertLevel; // CRITICAL (<15d), WARNING (16-30d), SAFE (>30d), EXPIRED
    private boolean canSell;
}
