package com.nhathuoc.pharmacy_backend.repository;

import com.nhathuoc.pharmacy_backend.entity.Invoice;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {

    List<Invoice> findTop10ByOrderBySaleDateDesc();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0.0) FROM Invoice i")
    Double sumTotalRevenue();

    @Query("SELECT COALESCE(SUM(i.totalAmount), 0.0) FROM Invoice i WHERE i.saleDate >= :startDate AND i.saleDate <= :endDate")
    Double sumRevenueBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    long countBySaleDateBetween(LocalDateTime startDate, LocalDateTime endDate);

    List<Invoice> findBySaleDateBetweenOrderBySaleDateAsc(LocalDateTime startDate, LocalDateTime endDate);
}
