package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "LoThuoc")
@Data
public class MedicineBatch {

    @Id
    @Column(name = "MaLo", length = 50)
    private String id;

    @Column(name = "SoLo", nullable = false)
    private int batchNumber;

    @ManyToOne
    @JoinColumn(name = "MaSanPham", nullable = false)
    private Medicine medicine;

    @Column(name = "SoLuongTon", nullable = false)
    private int quantity;

    @Column(name = "HanSuDung", nullable = false)
    private LocalDate expiryDate;

    @Column(name = "GiaNhap", nullable = false)
    private double purchasePrice;
}