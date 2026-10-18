package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;
import java.io.Serializable;

@Embeddable
@Data
public class ImportReceiptLineId implements Serializable {
    @Column(name = "MaPhieuNhap", length = 50) private String receiptId;
    @Column(name = "MaLo", length = 50) private String batchId;
}
