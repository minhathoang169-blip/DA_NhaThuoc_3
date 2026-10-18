package com.nhathuoc.pharmacy_backend.repository;

import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

import java.util.Collection;
import java.util.List;

public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, String> {

    List<MedicineBatch> findAllByMedicine_IdIn(Collection<String> medicineIds);

    List<MedicineBatch> findAllByOrderByExpiryDateAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select b from MedicineBatch b where b.id = :id")
    java.util.Optional<MedicineBatch> findByIdForUpdate(@Param("id") String id);
}
