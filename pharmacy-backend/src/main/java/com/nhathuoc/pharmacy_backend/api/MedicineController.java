package com.nhathuoc.pharmacy_backend.api;

import com.nhathuoc.pharmacy_backend.entity.Medicine;
import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import com.nhathuoc.pharmacy_backend.repository.MedicineBatchRepository;
import com.nhathuoc.pharmacy_backend.repository.MedicineRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.net.URI;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/medicines")
@Profile({"local", "sqlserver"})
public class MedicineController {

    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository batchRepository;

    public MedicineController(MedicineRepository medicineRepository, MedicineBatchRepository batchRepository) {
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<MedicineResponse> listMedicines() {
        List<Medicine> medicines = medicineRepository.findAllByOrderByNameAsc();
        Map<String, List<MedicineBatch>> batchesByMedicine = batchesByMedicine(medicines);
        return medicines.stream()
                .map(medicine -> toResponse(medicine, batchesByMedicine.getOrDefault(medicine.getId(), List.of())))
                .toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public MedicineResponse getMedicine(@PathVariable String id) {
        Medicine medicine = findMedicine(id);
        List<MedicineBatch> batches = batchRepository.findAllByMedicine_IdIn(List.of(id));
        return toResponse(medicine, batches);
    }

    @PostMapping
    @Transactional
    public ResponseEntity<MedicineResponse> createMedicine(@RequestBody MedicineRequest request) {
        validateMedicine(request, true);
        if (medicineRepository.existsById(request.id())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã sản phẩm đã tồn tại");
        }

        Medicine medicine = new Medicine();
        medicine.setId(request.id().trim());
        applyRequest(medicine, request);
        Medicine saved = medicineRepository.saveAndFlush(medicine);
        return ResponseEntity.created(URI.create("/api/medicines/" + saved.getId()))
                .body(toResponse(saved, List.of()));
    }

    @PutMapping("/{id}")
    @Transactional
    public MedicineResponse updateMedicine(@PathVariable String id, @RequestBody MedicineRequest request) {
        validateMedicine(request, false);
        Medicine medicine = findMedicine(id);
        applyRequest(medicine, request);
        return toResponse(medicineRepository.saveAndFlush(medicine),
                batchRepository.findAllByMedicine_IdIn(List.of(id)));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteMedicine(@PathVariable String id) {
        Medicine medicine = findMedicine(id);
        try {
            medicineRepository.delete(medicine);
            medicineRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Sản phẩm đang được lô thuốc hoặc giao dịch sử dụng");
        }
        return ResponseEntity.noContent().build();
    }

    private Map<String, List<MedicineBatch>> batchesByMedicine(List<Medicine> medicines) {
        if (medicines.isEmpty()) {
            return Map.of();
        }
        List<String> ids = medicines.stream().map(Medicine::getId).toList();
        return batchRepository.findAllByMedicine_IdIn(ids).stream()
                .collect(Collectors.groupingBy(batch -> batch.getMedicine().getId()));
    }

    private MedicineResponse toResponse(Medicine medicine, List<MedicineBatch> batches) {
        int stock = batches.stream().mapToInt(MedicineBatch::getQuantity).sum();
        Optional<LocalDate> nearestExpiry = batches.stream()
                .map(MedicineBatch::getExpiryDate)
                .min(LocalDate::compareTo);
        return new MedicineResponse(
                medicine.getId(),
                medicine.getName(),
                medicine.getCategory(),
                medicine.getPrice(),
                stock,
                nearestExpiry.orElse(null)
        );
    }

    private Medicine findMedicine(String id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy sản phẩm"));
    }

    private void validateMedicine(MedicineRequest request, boolean requireId) {
        if (request == null || request.name() == null || request.name().isBlank()
                || request.name().length() > 255 || request.price() == null || request.price() < 0
                || (request.category() != null && request.category().length() > 20)
                || (requireId && (request.id() == null || request.id().isBlank() || request.id().length() > 50))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin sản phẩm không hợp lệ");
        }
    }

    private void applyRequest(Medicine medicine, MedicineRequest request) {
        medicine.setName(request.name().trim());
        medicine.setCategory(request.category() == null ? null : request.category().trim());
        medicine.setPrice(request.price());
    }
}