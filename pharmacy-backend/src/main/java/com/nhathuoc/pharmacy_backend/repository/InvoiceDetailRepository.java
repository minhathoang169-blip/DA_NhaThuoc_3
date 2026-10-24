package com.nhathuoc.pharmacy_backend.repository;

import com.nhathuoc.pharmacy_backend.entity.InvoiceDetail;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface InvoiceDetailRepository extends JpaRepository<InvoiceDetail, Long> {
    List<InvoiceDetail> findByInvoice_Id(Long invoiceId);
    List<InvoiceDetail> findByBatch_Id(String batchId);
}
