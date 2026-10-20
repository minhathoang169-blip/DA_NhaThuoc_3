package com.nhathuoc.pharmacy_backend.repository;

import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Collection;
import java.util.List;

public interface MedicineBatchRepository extends JpaRepository<MedicineBatch, String> {

    List<MedicineBatch> findAllByMedicine_IdIn(Collection<String> medicineIds);

    List<MedicineBatch> findAllByOrderByExpiryDateAsc();
}