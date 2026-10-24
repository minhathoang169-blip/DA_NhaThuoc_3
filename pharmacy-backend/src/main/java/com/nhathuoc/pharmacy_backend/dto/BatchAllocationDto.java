package com.nhathuoc.pharmacy_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BatchAllocationDto {
    private String medicineId;
    private String medicineName;
    private String batchId;
    private int batchNumber;
    private LocalDate expiryDate;
    private int quantityAllocated;
    private double unitPrice;
    private double subtotal;
}
