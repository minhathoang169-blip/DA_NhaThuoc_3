package com.nhathuoc.pharmacy_backend.controller;

import com.nhathuoc.pharmacy_backend.dto.OnlineCheckoutRequest;
import com.nhathuoc.pharmacy_backend.dto.OnlineCheckoutResponse;
import com.nhathuoc.pharmacy_backend.security.CustomUserDetails;
import com.nhathuoc.pharmacy_backend.service.PosService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/orders")
public class OnlineOrderController {

    private final PosService posService;

    public OnlineOrderController(PosService posService) {
        this.posService = posService;
    }

    @PostMapping("/online-checkout")
    public ResponseEntity<OnlineCheckoutResponse> onlineCheckout(
            @Valid @RequestBody OnlineCheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails customerUser
    ) {
        OnlineCheckoutResponse response = posService.onlineCheckout(request, customerUser);
        return ResponseEntity.ok(response);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<java.util.List<com.nhathuoc.pharmacy_backend.entity.OnlineOrder>> getAllOrders() {
        return ResponseEntity.ok(posService.getAllOrders());
    }

    @GetMapping("/track/{orderNumber}")
    public ResponseEntity<com.nhathuoc.pharmacy_backend.entity.OnlineOrder> trackOrder(@PathVariable String orderNumber) {
        return ResponseEntity.ok(posService.getOrderByNumber(orderNumber));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<com.nhathuoc.pharmacy_backend.entity.OnlineOrder> updateOrderStatus(
            @PathVariable Long id,
            @RequestBody java.util.Map<String, String> body
    ) {
        String status = body.getOrDefault("status", "CONFIRMED");
        return ResponseEntity.ok(posService.updateOrderStatus(id, status));
    }
}
