package com.nhathuoc.pharmacy_backend.repository;

import com.nhathuoc.pharmacy_backend.entity.ImportReceipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface ImportReceiptRepository extends JpaRepository<ImportReceipt, String> {
    java.util.List<ImportReceipt> findAllByOrderByTransactionDateDesc();
    @Query("select count(line) > 0 from ImportReceiptLine line where line.batch.id = :batchId")
    boolean hasBatchHistory(@Param("batchId") String batchId);
}
