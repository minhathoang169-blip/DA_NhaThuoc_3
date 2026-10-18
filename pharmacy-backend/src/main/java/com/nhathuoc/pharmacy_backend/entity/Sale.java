package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "DonHang")
@Getter
@Setter
public class Sale {
    @Id @Column(name = "MaDonHang", length = 50) private String id;
    @ManyToOne @JoinColumn(name = "MaKhachHang") private Customer customer;
    @ManyToOne(optional = false) @JoinColumn(name = "MaNhanVien", nullable = false) private Employee employee;
    @Column(name = "NgayGiaoDich", nullable = false) private LocalDate transactionDate;
    @OneToMany(mappedBy = "sale", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<SaleLine> lines = new ArrayList<>();
}
