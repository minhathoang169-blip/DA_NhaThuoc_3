package com.nhathuoc.pharmacy_backend.repository;

import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;

public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, String> {

    List<MedicineBatch> findAllByMedicine_IdIn(Collection<String> medicineIds);

    List<MedicineBatch> findAllByOrderByExpiryDateAsc();

    /**
     * Khóa dòng (Pessimistic Write Lock) ngăn chặn Race Condition khi nhiều quầy POS hoặc đơn Online
     * cùng đặt một loại thuốc tại cùng 1 thời điểm.
     * Áp dụng nguyên tắc FEFO: Chỉ lấy các lô CÒN HẠN (expiryDate >= today), số lượng tồn > 0,
     * sắp xếp ưu tiên lô cận hạn nhất lên đầu (expiryDate ASC).
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT b FROM MedicineBatch b WHERE b.medicine.id = :medicineId AND b.expiryDate >= :today AND b.quantity > 0 ORDER BY b.expiryDate ASC, b.id ASC")
    List<MedicineBatch> findAvailableBatchesForSaleWithLock(
            @Param("medicineId") String medicineId,
            @Param("today") LocalDate today
    );

    @Query("SELECT b FROM MedicineBatch b WHERE b.medicine.id = :medicineId AND b.expiryDate >= :today AND b.quantity > 0 ORDER BY b.expiryDate ASC")
    List<MedicineBatch> findAvailableBatches(
            @Param("medicineId") String medicineId,
            @Param("today") LocalDate today
    );

    @Query("SELECT b FROM MedicineBatch b WHERE b.expiryDate >= :today AND b.expiryDate <= :targetDate AND b.quantity > 0 ORDER BY b.expiryDate ASC")
    List<MedicineBatch> findExpiringBatches(
            @Param("today") LocalDate today,
            @Param("targetDate") LocalDate targetDate
    );

    @Query("SELECT COUNT(b) FROM MedicineBatch b WHERE b.expiryDate >= :today AND b.expiryDate <= :targetDate AND b.quantity > 0")
    long countExpiringBatches(
            @Param("today") LocalDate today,
            @Param("targetDate") LocalDate targetDate
    );

    @Query("SELECT COALESCE(SUM(b.quantity), 0) FROM MedicineBatch b WHERE b.medicine.id = :medicineId AND b.expiryDate >= :today")
    int getAvailableStockForMedicine(
            @Param("medicineId") String medicineId,
            @Param("today") LocalDate today
    );
}