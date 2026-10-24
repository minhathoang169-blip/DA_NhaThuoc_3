package com.nhathuoc.pharmacy_backend.dto;

import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class SubstituteMedicineResponse {
    private String id;
    private String name;
    private String category;
    private double price;
    private Long activeIngredientId;
    private String activeIngredientName;
    private int availableStock;
    private LocalDate nearestExpiryDate;
}
