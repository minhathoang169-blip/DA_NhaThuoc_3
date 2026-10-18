package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "PhieuNhap")
@Getter
@Setter
public class ImportReceipt {
    @Id @Column(name = "MaPhieuNhap", length = 50) private String id;
    @ManyToOne(optional = false) @JoinColumn(name = "MaNhaCungCap", nullable = false) private Supplier supplier;
    @ManyToOne(optional = false) @JoinColumn(name = "MaNhanVien", nullable = false) private Employee employee;
    @Column(name = "NgayGiaoDich", nullable = false) private LocalDate transactionDate;
    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<ImportReceiptLine> lines = new ArrayList<>();
}
