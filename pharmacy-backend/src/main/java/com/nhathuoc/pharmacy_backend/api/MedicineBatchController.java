package com.nhathuoc.pharmacy_backend.api;

import com.nhathuoc.pharmacy_backend.entity.Medicine;
import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import com.nhathuoc.pharmacy_backend.repository.MedicineBatchRepository;
import com.nhathuoc.pharmacy_backend.repository.MedicineRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/batches")
@Profile({"local", "sqlserver"})
public class MedicineBatchController {

    private final MedicineBatchRepository batchRepository;
    private final MedicineRepository medicineRepository;

    public MedicineBatchController(MedicineBatchRepository batchRepository, MedicineRepository medicineRepository) {
        this.batchRepository = batchRepository;
        this.medicineRepository = medicineRepository;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<MedicineBatchResponse> listBatches() {
        return batchRepository.findAllByOrderByExpiryDateAsc().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public MedicineBatchResponse getBatch(@PathVariable String id) {
        return toResponse(findBatch(id));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<MedicineBatchResponse> createBatch(@RequestBody MedicineBatchRequest request) {
        validate(request, true);
        if (batchRepository.existsById(request.id())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã lô thuốc đã tồn tại");
        }
        MedicineBatch batch = new MedicineBatch();
        batch.setId(request.id().trim());
        applyRequest(batch, request);
        MedicineBatch saved = batchRepository.saveAndFlush(batch);
        return ResponseEntity.created(URI.create("/api/batches/" + saved.getId())).body(toResponse(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public MedicineBatchResponse updateBatch(@PathVariable String id, @RequestBody MedicineBatchRequest request) {
        validate(request, false);
        MedicineBatch batch = findBatch(id);
        applyRequest(batch, request);
        return toResponse(batchRepository.saveAndFlush(batch));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> deleteBatch(@PathVariable String id) {
        try {
            batchRepository.delete(findBatch(id));
            batchRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Lô thuốc đang được phiếu nhập hoặc đơn hàng sử dụng");
        }
        return ResponseEntity.noContent().build();
    }

    private void validate(MedicineBatchRequest request, boolean requireId) {
        if (request == null || (requireId && (request.id() == null || request.id().isBlank() || request.id().length() > 50))
                || request.medicineId() == null || request.medicineId().isBlank()
                || request.medicineId().length() > 50 || request.batchNumber() == null
                || request.expiryDate() == null || request.quantity() == null || request.quantity() < 0
                || request.purchasePrice() == null || request.purchasePrice() < 0) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin lô thuốc không hợp lệ");
        }
    }

    private void applyRequest(MedicineBatch batch, MedicineBatchRequest request) {
        Medicine medicine = medicineRepository.findById(request.medicineId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Mã sản phẩm không tồn tại"));
        batch.setMedicine(medicine);
        batch.setBatchNumber(request.batchNumber());
        batch.setExpiryDate(request.expiryDate());
        batch.setQuantity(request.quantity());
        batch.setPurchasePrice(request.purchasePrice());
    }

    private MedicineBatch findBatch(String id) {
        return batchRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy lô thuốc"));
    }

    private MedicineBatchResponse toResponse(MedicineBatch batch) {
        return new MedicineBatchResponse(
                batch.getId(),
                batch.getMedicine().getId(),
                batch.getMedicine().getName(),
                batch.getBatchNumber(),
                batch.getExpiryDate(),
                batch.getQuantity(),
                batch.getPurchasePrice()
        );
    }
}