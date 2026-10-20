package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;

@Entity
@Table(name = "NhaCungCap")
@Data
public class Supplier {

    @Id
    @Column(name = "MaNhaCungCap", length = 50)
    private String id;

    @Column(name = "TenNhaCungCap", nullable = false, length = 50)
    private String name;

    @Column(name = "SoDienThoai", length = 20)
    private String phone;

    @Column(name = "DiaChi", length = 50)
    private String address;
}