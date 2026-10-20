package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "invoices")
@Data
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime saleDate = LocalDateTime.now();

    private double totalAmount;

    @ManyToOne
    @JoinColumn(name = "pharmacist_id")
    private User pharmacist;

    @OneToMany(mappedBy = "invoice", cascade = CascadeType.ALL)
    private List<InvoiceDetail> invoiceDetails;
}

@Entity
@Table(name = "invoice_details")
@Data
class InvoiceDetail {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "invoice_id")
    private Invoice invoice;

    @ManyToOne
    @JoinColumn(name = "batch_id")
    private MedicineBatch batch;

    private int quantity;

    private double unitPrice;
}