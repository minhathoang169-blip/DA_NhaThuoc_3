package com.nhathuoc.pharmacy_backend.controller;

import com.nhathuoc.pharmacy_backend.dto.BatchDetailResponse;
import com.nhathuoc.pharmacy_backend.dto.ExpiringBatchResponse;
import com.nhathuoc.pharmacy_backend.dto.InventoryImportRequest;
import com.nhathuoc.pharmacy_backend.service.InventoryService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/inventory")
public class InventoryController {

    private final InventoryService inventoryService;

    public InventoryController(InventoryService inventoryService) {
        this.inventoryService = inventoryService;
    }

    /**
     * API Nhập kho: Tạo hóa đơn nhập kèm sinh mã Lô, HSD, NSX, số lượng nhập, giá vốn
     * POST /api/v1/inventory/import
     */
    @PostMapping("/import")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<BatchDetailResponse> importBatch(@Valid @RequestBody InventoryImportRequest request) {
        BatchDetailResponse response = inventoryService.importBatch(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    /**
     * API Danh sách Lô thuốc: Hiển thị trực quan trạng thái hạn dùng (Đỏ/Vàng/Xanh)
     * GET /api/v1/inventory/batches?status=all|critical|warning|safe|expired
     */
    @GetMapping("/batches")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<List<BatchDetailResponse>> getAllBatches(
            @RequestParam(value = "status", required = false, defaultValue = "all") String status
    ) {
        return ResponseEntity.ok(inventoryService.getAllBatches(status));
    }

    /**
     * API Cảnh báo date: Danh sách các lô thuốc sắp hết hạn trong N ngày tới
     * GET /api/v1/inventory/expiring-batches?days=30
     */
    @GetMapping("/expiring-batches")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<List<ExpiringBatchResponse>> getExpiringBatches(
            @RequestParam(value = "days", defaultValue = "30") int days
    ) {
        return ResponseEntity.ok(inventoryService.getExpiringBatches(days));
    }
}
