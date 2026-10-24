package com.nhathuoc.pharmacy_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OnlineCheckoutResponse {
    private Long orderId;
    private String orderNumber;
    private LocalDateTime orderDate;
    private double totalAmount;
    private String status;
    private String shippingAddress;
    private String receiverName;
    private String receiverPhone;
    private List<BatchAllocationDto> allocations;
}
