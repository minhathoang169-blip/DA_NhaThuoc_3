package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
@Data
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 100)
    private String fullName;

    @Column(length = 100, unique = true)
    private String email;

    @Column(length = 20)
    private String phone;

    // Phân quyền: ADMIN, PHARMACIST (Dược sĩ), WAREHOUSE (Thủ kho), CUSTOMER (Khách hàng)
    @Column(nullable = false, length = 30)
    private String role;

    private LocalDateTime createdAt = LocalDateTime.now();
}