package com.nhathuoc.pharmacy_backend.controller;

import com.nhathuoc.pharmacy_backend.dto.PosCheckoutRequest;
import com.nhathuoc.pharmacy_backend.dto.PosCheckoutResponse;
import com.nhathuoc.pharmacy_backend.security.CustomUserDetails;
import com.nhathuoc.pharmacy_backend.service.PosService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/pos")
public class PosController {

    private final PosService posService;

    public PosController(PosService posService) {
        this.posService = posService;
    }

    /**
     * Bán lẻ tại quầy POS dành cho Dược sĩ / Quản lý:
     * - Trừ tồn kho tự động theo cơ chế FEFO (First Expired, First Out).
     * - Chống Race Condition với Pessimistic Locking.
     */
    @PostMapping("/checkout")
    @PreAuthorize("hasAnyRole('ADMIN', 'PHARMACIST')")
    public ResponseEntity<PosCheckoutResponse> checkout(
            @Valid @RequestBody PosCheckoutRequest request,
            @AuthenticationPrincipal CustomUserDetails pharmacistUser
    ) {
        PosCheckoutResponse response = posService.checkout(request, pharmacistUser);
        return ResponseEntity.ok(response);
    }
}
