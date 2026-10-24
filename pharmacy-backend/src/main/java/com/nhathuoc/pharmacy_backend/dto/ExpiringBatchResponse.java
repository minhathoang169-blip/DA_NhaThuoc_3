package com.nhathuoc.pharmacy_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ExpiringBatchResponse {
    private String batchId;
    private int batchNumber;
    private String medicineId;
    private String medicineName;
    private int quantity;
    private LocalDate expiryDate;
    private long daysRemaining;
    private String alertLevel; // CRITICAL (< 15 ngày), WARNING (15 - 30 ngày), OK (> 30 ngày)
}
