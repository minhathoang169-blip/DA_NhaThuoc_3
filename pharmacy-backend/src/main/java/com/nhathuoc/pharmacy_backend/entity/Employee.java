package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

import java.time.LocalDate;

@Entity
@Table(name = "NhanVien")
@Data
public class Employee {

    @Id
    @Column(name = "MaNhanVien", length = 50)
    private String id;

    @Column(name = "HoTen", nullable = false, length = 50)
    private String name;

    @Column(name = "SoDienThoai", length = 20)
    private String phone;

    @Column(name = "NgaySinh")
    private LocalDate birthDate;

    @Column(name = "ChucVu", length = 50)
    private String role;

    @Column(name = "NgayBatDau")
    private LocalDate startDate;
}