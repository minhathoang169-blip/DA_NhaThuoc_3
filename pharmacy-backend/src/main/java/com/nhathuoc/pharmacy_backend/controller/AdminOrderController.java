package com.nhathuoc.pharmacy_backend.controller;

import com.nhathuoc.pharmacy_backend.entity.OnlineOrder;
import com.nhathuoc.pharmacy_backend.service.PosService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/admin/orders")
public class AdminOrderController {

    private final PosService posService;

    public AdminOrderController(PosService posService) {
        this.posService = posService;
    }

    /**
     * Đồng bộ danh sách đơn đặt từ Mobile App:
     * GET /api/v1/admin/orders
     */
    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<List<OnlineOrder>> getAdminOrders() {
        return ResponseEntity.ok(posService.getAllOrders());
    }

    /**
     * Cập nhật trạng thái đơn (PENDING, CONFIRMED, PACKED, SHIPPING, COMPLETED, CANCELLED):
     * PUT /api/v1/admin/orders/{id}/status
     */
    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<OnlineOrder> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body
    ) {
        String status = body.getOrDefault("status", "CONFIRMED");
        return ResponseEntity.ok(posService.updateOrderStatus(id, status));
    }

    /**
     * Thao tác "Xác nhận & Xuất kho":
     * POST /api/v1/admin/orders/{id}/fulfill
     */
    @PostMapping("/{id}/fulfill")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<OnlineOrder> fulfillOrder(@PathVariable Long id) {
        return ResponseEntity.ok(posService.updateOrderStatus(id, "PACKED"));
    }
}
