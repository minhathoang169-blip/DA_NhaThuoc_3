package com.nhathuoc.pharmacy_backend.service;

import com.nhathuoc.pharmacy_backend.dto.BatchDetailResponse;
import com.nhathuoc.pharmacy_backend.dto.ExpiringBatchResponse;
import com.nhathuoc.pharmacy_backend.dto.InventoryImportRequest;
import com.nhathuoc.pharmacy_backend.entity.Medicine;
import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import com.nhathuoc.pharmacy_backend.exception.ResourceNotFoundException;
import com.nhathuoc.pharmacy_backend.repository.MedicineBatchRepository;
import com.nhathuoc.pharmacy_backend.repository.MedicineRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

@Service
public class InventoryService {

    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository batchRepository;

    public InventoryService(MedicineRepository medicineRepository, MedicineBatchRepository batchRepository) {
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
    }

    /**
     * Nhập kho Lô thuốc mới:
     * - Tự động sinh mã Lô nếu chưa nhập.
     * - Lưu thông tin Hạn dùng, Ngày SX, Số lượng nhập, Giá vốn (purchasePrice).
     */
    @Transactional
    public BatchDetailResponse importBatch(InventoryImportRequest request) {
        Medicine medicine = medicineRepository.findById(request.getMedicineId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thuốc có mã: " + request.getMedicineId()));

        String batchCode = request.getBatchNumber();
        if (batchCode == null || batchCode.trim().isBlank()) {
            batchCode = "LOT-" + medicine.getId() + "-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyMMdd"))
                    + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        }

        int numericBatchNum = (int) (System.currentTimeMillis() % 1000000);

        MedicineBatch batch = new MedicineBatch();
        batch.setId(batchCode);
        batch.setBatchNumber(numericBatchNum);
        batch.setMedicine(medicine);
        batch.setQuantity(request.getQuantity());
        batch.setExpiryDate(request.getExpiryDate());
        batch.setPurchasePrice(request.getCostPrice());

        MedicineBatch savedBatch = batchRepository.save(batch);

        LocalDate today = LocalDate.now();
        long daysRemaining = ChronoUnit.DAYS.between(today, savedBatch.getExpiryDate());
        String alertLevel = determineAlertLevel(daysRemaining);
        boolean canSell = daysRemaining > 15 && savedBatch.getQuantity() > 0;

        return new BatchDetailResponse(
                savedBatch.getId(),
                savedBatch.getBatchNumber(),
                medicine.getId(),
                medicine.getName(),
                medicine.getCategory(),
                savedBatch.getQuantity(),
                savedBatch.getPurchasePrice(),
                savedBatch.getExpiryDate(),
                daysRemaining,
                alertLevel,
                canSell
        );
    }

    /**
     * Lấy toàn bộ danh sách Lô thuốc kèm trạng thái hạn dùng FEFO
     */
    @Transactional(readOnly = true)
    public List<BatchDetailResponse> getAllBatches(String filterStatus) {
        LocalDate today = LocalDate.now();
        List<MedicineBatch> batches = batchRepository.findAllByOrderByExpiryDateAsc();

        return batches.stream()
                .map(b -> {
                    long daysRemaining = ChronoUnit.DAYS.between(today, b.getExpiryDate());
                    String alertLevel = determineAlertLevel(daysRemaining);
                    boolean canSell = daysRemaining > 15 && b.getQuantity() > 0;

                    return new BatchDetailResponse(
                            b.getId(),
                            b.getBatchNumber(),
                            b.getMedicine().getId(),
                            b.getMedicine().getName(),
                            b.getMedicine().getCategory(),
                            b.getQuantity(),
                            b.getPurchasePrice(),
                            b.getExpiryDate(),
                            daysRemaining,
                            alertLevel,
                            canSell
                    );
                })
                .filter(dto -> {
                    if (filterStatus == null || filterStatus.isBlank() || "all".equalsIgnoreCase(filterStatus)) {
                        return true;
                    }
                    return filterStatus.equalsIgnoreCase(dto.getAlertLevel());
                })
                .toList();
    }

    /**
     * Lấy danh sách các lô thuốc sắp hết hạn trong N ngày tới
     */
    @Transactional(readOnly = true)
    public List<ExpiringBatchResponse> getExpiringBatches(int days) {
        if (days <= 0) days = 30;
        LocalDate today = LocalDate.now();
        LocalDate targetDate = today.plusDays(days);

        List<MedicineBatch> batches = batchRepository.findExpiringBatches(today, targetDate);

        return batches.stream().map(b -> {
            long daysRemaining = ChronoUnit.DAYS.between(today, b.getExpiryDate());
            String alertLevel = determineAlertLevel(daysRemaining);

            return new ExpiringBatchResponse(
                    b.getId(),
                    b.getBatchNumber(),
                    b.getMedicine().getId(),
                    b.getMedicine().getName(),
                    b.getQuantity(),
                    b.getExpiryDate(),
                    daysRemaining,
                    alertLevel
            );
        }).toList();
    }

    private String determineAlertLevel(long daysRemaining) {
        if (daysRemaining < 0) {
            return "EXPIRED"; // Đã hết hạn
        } else if (daysRemaining <= 15) {
            return "CRITICAL"; // Đỏ (Khẩn cấp: <= 15 ngày, chặn xuất bán quầy)
        } else if (daysRemaining <= 30) {
            return "WARNING"; // Vàng (Cảnh báo: 16-30 ngày, ưu tiên đẩy kho)
        } else {
            return "SAFE"; // Xanh (An toàn: > 30 ngày)
        }
    }
}
