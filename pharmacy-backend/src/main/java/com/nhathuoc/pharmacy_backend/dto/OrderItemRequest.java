package com.nhathuoc.pharmacy_backend.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderItemRequest {
    @NotBlank(message = "Mã sản phẩm không được để trống")
    private String medicineId;

    @Min(value = 1, message = "Số lượng mua tối thiểu là 1")
    private int quantity;
}
