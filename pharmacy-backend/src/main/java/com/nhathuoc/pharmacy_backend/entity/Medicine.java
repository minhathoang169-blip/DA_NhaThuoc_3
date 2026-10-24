package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "SanPham")
@Data
public class Medicine {

    @Id
    @Column(name = "MaSanPham", length = 50)
    private String id;

    @Column(name = "TenSanPham", nullable = false, length = 255)
    private String name;

    @Column(name = "LoaiSanPham", length = 20)
    private String category;

    @Column(name = "GiaBan", nullable = false)
    private double price;

    @Column(name = "barcode", length = 50)
    private String barcode;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "active_ingredient_id")
    private ActiveIngredient activeIngredient;

    public Medicine() {}

    public Medicine(String id, String name, String category, double price, String barcode, ActiveIngredient activeIngredient) {
        this.id = id;
        this.name = name;
        this.category = category;
        this.price = price;
        this.barcode = barcode;
        this.activeIngredient = activeIngredient;
    }
}