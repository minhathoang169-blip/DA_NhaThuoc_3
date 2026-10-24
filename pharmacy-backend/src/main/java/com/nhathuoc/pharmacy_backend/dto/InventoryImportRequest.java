package com.nhathuoc.pharmacy_backend.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class InventoryImportRequest {

    @NotBlank(message = "Mã thuốc không được để trống")
    private String medicineId;

    private String batchNumber; // Có thể nhập hoặc để hệ thống sinh tự động

    private LocalDate manufacturingDate;

    @NotNull(message = "Hạn sử dụng không được để trống")
    @Future(message = "Hạn sử dụng phải lớn hơn ngày hiện tại")
    private LocalDate expiryDate;

    @Min(value = 1, message = "Số lượng nhập phải lớn hơn 0")
    private int quantity;

    @Min(value = 0, message = "Giá vốn (giá nhập) không được âm")
    private double costPrice;

    private Long supplierId;
}
