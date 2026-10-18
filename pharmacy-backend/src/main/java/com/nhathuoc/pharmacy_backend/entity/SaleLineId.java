package com.nhathuoc.pharmacy_backend.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import lombok.Data;
import java.io.Serializable;

@Embeddable
@Data
public class SaleLineId implements Serializable {
    @Column(name = "MaDonHang", length = 50) private String saleId;
    @Column(name = "MaLo", length = 50) private String batchId;
}
