package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "online_orders")
@Data
public class OnlineOrder {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "customer_id")
    private User customer;

    private LocalDateTime orderDate = LocalDateTime.now();

    private double totalAmount;

    @Column(length = 30)
    private String status = "PENDING";

    @Column(length = 255)
    private String shippingAddress;

    @OneToMany(mappedBy = "onlineOrder", cascade = CascadeType.ALL)
    private List<OrderDetail> orderDetails;
}

@Entity
@Table(name = "order_details")
@Data
class OrderDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "order_id")
    private OnlineOrder onlineOrder;

    @ManyToOne
    @JoinColumn(name = "medicine_id")
    private Medicine medicine;

    private int quantity;

    private double price;
}