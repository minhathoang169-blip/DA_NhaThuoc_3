package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ChiTietDonHang")
@Getter
@Setter
public class SaleLine {
    @EmbeddedId private SaleLineId id = new SaleLineId();
    @MapsId("saleId") @ManyToOne(optional = false) @JoinColumn(name = "MaDonHang", nullable = false)
    private Sale sale;
    @MapsId("batchId") @ManyToOne(optional = false) @JoinColumn(name = "MaLo", nullable = false)
    private MedicineBatch batch;
    @Column(name = "SoLuong", nullable = false) private int quantity;
    @Column(name = "DonGia", nullable = false) private double unitPrice;
}
