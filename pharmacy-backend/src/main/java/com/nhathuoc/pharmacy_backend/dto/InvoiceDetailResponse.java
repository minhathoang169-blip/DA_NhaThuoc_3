package com.nhathuoc.pharmacy_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InvoiceDetailResponse {
    private Long id;
    private String medicineId;
    private String medicineName;
    private String batchId;
    private int quantity;
    private double unitPrice;
    private double totalPrice;
}
