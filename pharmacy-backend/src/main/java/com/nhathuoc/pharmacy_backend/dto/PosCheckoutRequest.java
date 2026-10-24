package com.nhathuoc.pharmacy_backend.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PosCheckoutRequest {

    @NotEmpty(message = "Danh sách sản phẩm mua không được rỗng")
    @Valid
    private List<OrderItemRequest> items;

    private double discountAmount = 0.0;

    private double customerPaid = 0.0;

    private String paymentMethod = "CASH"; // CASH, CARD, TRANSFER

    private String customerName = "Khách vãng lai";

    private String customerPhone;
}
