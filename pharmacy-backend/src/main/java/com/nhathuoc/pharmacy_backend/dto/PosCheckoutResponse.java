package com.nhathuoc.pharmacy_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PosCheckoutResponse {
    private Long invoiceId;
    private String invoiceNumber;
    private LocalDateTime saleDate;
    private double subtotal;
    private double discountAmount;
    private double totalAmount;
    private double customerPaid;
    private double changeAmount;
    private String paymentMethod;
    private String pharmacistUsername;
    private String pharmacistName;
    private String customerName;
    private String customerPhone;
    private List<InvoiceDetailResponse> items;
    private List<BatchAllocationDto> allocations;
}
