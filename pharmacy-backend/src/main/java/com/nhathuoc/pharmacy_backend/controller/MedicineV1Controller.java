package com.nhathuoc.pharmacy_backend.controller;

import com.nhathuoc.pharmacy_backend.dto.SubstituteMedicineResponse;
import com.nhathuoc.pharmacy_backend.service.MedicineService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/medicines")
public class MedicineV1Controller {

    private final MedicineService medicineService;

    public MedicineV1Controller(MedicineService medicineService) {
        this.medicineService = medicineService;
    }

    /**
     * Tra cứu thuốc nâng cao cho màn hình POS (tìm theo tên thuốc, mã vạch, hoạt chất)
     */
    @GetMapping("/search")
    public ResponseEntity<List<Map<String, Object>>> search(@RequestParam(value = "q", required = false) String query) {
        return ResponseEntity.ok(medicineService.searchMedicines(query));
    }

    /**
     * Gợi ý thuốc thay thế có cùng hoạt chất chính (Active Ingredients) khi thuốc hiện tại hết hàng:
     * GET /api/v1/medicines/{id}/substitutes
     */
    @GetMapping("/{id}/substitutes")
    public ResponseEntity<List<SubstituteMedicineResponse>> getSubstitutes(@PathVariable("id") String id) {
        return ResponseEntity.ok(medicineService.getSubstitutes(id));
    }
}
