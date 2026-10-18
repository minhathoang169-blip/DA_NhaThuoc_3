package com.nhathuoc.pharmacy_backend.repository;

import com.nhathuoc.pharmacy_backend.entity.Sale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleRepository extends JpaRepository<Sale, String> {
    java.util.List<Sale> findAllByOrderByTransactionDateDesc();
    @Query("select count(line) > 0 from SaleLine line where line.batch.id = :batchId")
    boolean hasBatchHistory(@Param("batchId") String batchId);
}
