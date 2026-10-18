package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "ChiTietPhieuNhap")
@Getter
@Setter
public class ImportReceiptLine {
    @EmbeddedId private ImportReceiptLineId id = new ImportReceiptLineId();
    @MapsId("receiptId") @ManyToOne(optional = false) @JoinColumn(name = "MaPhieuNhap", nullable = false)
    private ImportReceipt receipt;
    @MapsId("batchId") @ManyToOne(optional = false) @JoinColumn(name = "MaLo", nullable = false)
    private MedicineBatch batch;
    @Column(name = "SoLuong", nullable = false) private int quantity;
    @Column(name = "DonGia", nullable = false) private double unitPrice;
}
