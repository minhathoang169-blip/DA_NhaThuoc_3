package com.nhathuoc.pharmacy_backend.repository;

import com.nhathuoc.pharmacy_backend.entity.OnlineOrder;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

import java.util.Optional;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;

public interface OnlineOrderRepository extends JpaRepository<OnlineOrder, Long> {
    List<OnlineOrder> findByCustomer_IdOrderByOrderDateDesc(Long customerId);
    List<OnlineOrder> findTop10ByOrderByOrderDateDesc();
    List<OnlineOrder> findAllByOrderByOrderDateDesc();
    Optional<OnlineOrder> findByOrderNumber(String orderNumber);

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM OnlineOrder o WHERE o.status <> 'CANCELLED'")
    Double sumTotalRevenue();

    @Query("SELECT COALESCE(SUM(o.totalAmount), 0.0) FROM OnlineOrder o WHERE o.orderDate >= :startDate AND o.orderDate <= :endDate AND o.status <> 'CANCELLED'")
    Double sumRevenueBetween(@Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);

    long countByOrderDateBetween(LocalDateTime startDate, LocalDateTime endDate);
}
