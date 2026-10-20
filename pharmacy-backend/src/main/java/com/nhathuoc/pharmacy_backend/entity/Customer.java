package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "KhachHang")
@Data
public class Customer {

    @Id
    @Column(name = "MaKhachHang", length = 50)
    private String id;

    @Column(name = "HoTen", nullable = false, length = 50)
    private String name;

    @Column(name = "SoDienThoai", length = 20)
    private String phone;

    @Column(name = "DiaChi", length = 50)
    private String address;

    @Column(name = "NgayKhoiTao")
    private LocalDate createdAt;
}