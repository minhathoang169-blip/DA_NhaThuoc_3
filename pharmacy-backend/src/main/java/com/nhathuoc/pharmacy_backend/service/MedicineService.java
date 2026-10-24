package com.nhathuoc.pharmacy_backend.service;

import com.nhathuoc.pharmacy_backend.dto.SubstituteMedicineResponse;
import com.nhathuoc.pharmacy_backend.entity.Medicine;
import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import com.nhathuoc.pharmacy_backend.exception.ResourceNotFoundException;
import com.nhathuoc.pharmacy_backend.repository.MedicineBatchRepository;
import com.nhathuoc.pharmacy_backend.repository.MedicineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.*;

@Service
public class MedicineService {

    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository batchRepository;

    public MedicineService(MedicineRepository medicineRepository, MedicineBatchRepository batchRepository) {
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
    }

    /**
     * Tìm kiếm thuốc theo tên, mã vạch hoặc hoạt chất chính
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> searchMedicines(String query) {
        LocalDate today = LocalDate.now();
        List<Medicine> medicines;
        if (query == null || query.trim().isBlank()) {
            medicines = medicineRepository.findAllByOrderByNameAsc();
        } else {
            medicines = medicineRepository.searchByNameBarcodeOrActiveIngredient(query.trim());
        }

        List<String> medicineIds = medicines.stream().map(Medicine::getId).toList();
        List<MedicineBatch> allBatches = batchRepository.findAllByMedicine_IdIn(medicineIds);

        Map<String, List<MedicineBatch>> batchesByMed = new HashMap<>();
        for (MedicineBatch b : allBatches) {
            batchesByMed.computeIfAbsent(b.getMedicine().getId(), k -> new ArrayList<>()).add(b);
        }

        return medicines.stream().map(m -> {
            List<MedicineBatch> batches = batchesByMed.getOrDefault(m.getId(), List.of());
            List<MedicineBatch> validBatches = batches.stream()
                    .filter(b -> b.getExpiryDate() != null && !b.getExpiryDate().isBefore(today) && b.getQuantity() > 0)
                    .sorted(Comparator.comparing(MedicineBatch::getExpiryDate))
                    .toList();

            int totalStock = validBatches.stream().mapToInt(MedicineBatch::getQuantity).sum();
            LocalDate nearestExpiry = validBatches.isEmpty() ? null : validBatches.get(0).getExpiryDate();

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", m.getId());
            map.put("name", m.getName());
            map.put("category", m.getCategory());
            map.put("price", m.getPrice());
            map.put("barcode", m.getBarcode());
            map.put("activeIngredientId", m.getActiveIngredient() != null ? m.getActiveIngredient().getId() : null);
            map.put("activeIngredientName", m.getActiveIngredient() != null ? m.getActiveIngredient().getName() : null);
            map.put("totalStock", totalStock);
            map.put("nearestExpiry", nearestExpiry);
            map.put("batches", validBatches.stream().map(b -> {
                Map<String, Object> batchMap = new HashMap<>();
                batchMap.put("id", b.getId());
                batchMap.put("batchNumber", b.getBatchNumber());
                batchMap.put("quantity", b.getQuantity());
                batchMap.put("expiryDate", b.getExpiryDate());
                return batchMap;
            }).toList());

            return map;
        }).toList();
    }

    /**
     * Gợi ý thuốc thay thế (Substitutes):
     * Tìm các thuốc khác còn hàng trong kho có chung hoạt chất chính (Active Ingredient),
     * loại trừ thuốc hiện tại và chỉ lấy các thuốc có tổng tồn kho còn hạn > 0.
     */
    @Transactional(readOnly = true)
    public List<SubstituteMedicineResponse> getSubstitutes(String medicineId) {
        Medicine currentMedicine = medicineRepository.findById(medicineId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thuốc có mã: " + medicineId));

        if (currentMedicine.getActiveIngredient() == null) {
            return List.of();
        }

        Long activeIngredientId = currentMedicine.getActiveIngredient().getId();
        String activeIngredientName = currentMedicine.getActiveIngredient().getName();

        List<Medicine> candidates = medicineRepository.findSubstitutesByActiveIngredient(activeIngredientId, medicineId);

        LocalDate today = LocalDate.now();
        List<SubstituteMedicineResponse> result = new ArrayList<>();

        for (Medicine cand : candidates) {
            List<MedicineBatch> validBatches = batchRepository.findAvailableBatches(cand.getId(), today);
            int availableStock = validBatches.stream().mapToInt(MedicineBatch::getQuantity).sum();

            // Chỉ gợi ý các thuốc CÒN HÀNG (availableStock > 0)
            if (availableStock > 0) {
                LocalDate nearestExpiry = validBatches.get(0).getExpiryDate();
                result.add(new SubstituteMedicineResponse(
                        cand.getId(),
                        cand.getName(),
                        cand.getCategory(),
                        cand.getPrice(),
                        activeIngredientId,
                        activeIngredientName,
                        availableStock,
                        nearestExpiry
                ));
            }
        }

        return result;
    }
}
