package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "active_ingredients")
@Data
public class ActiveIngredient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 150)
    private String name; // Tên hoạt chất (Ví dụ: Paracetamol, Ibuprofen...)

    @Column(columnDefinition = "TEXT")
    private String description;
}