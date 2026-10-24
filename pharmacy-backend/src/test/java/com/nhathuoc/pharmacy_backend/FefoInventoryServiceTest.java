package com.nhathuoc.pharmacy_backend;

import com.nhathuoc.pharmacy_backend.dto.OrderItemRequest;
import com.nhathuoc.pharmacy_backend.dto.PosCheckoutRequest;
import com.nhathuoc.pharmacy_backend.dto.PosCheckoutResponse;
import com.nhathuoc.pharmacy_backend.entity.Medicine;
import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import com.nhathuoc.pharmacy_backend.exception.InsufficientStockException;
import com.nhathuoc.pharmacy_backend.repository.MedicineBatchRepository;
import com.nhathuoc.pharmacy_backend.repository.MedicineRepository;
import com.nhathuoc.pharmacy_backend.service.PosService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class FefoInventoryServiceTest {

    @Autowired
    private PosService posService;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private MedicineBatchRepository batchRepository;

    @Test
    @DisplayName("FEFO Case 1: Đơn hàng phân bổ trừ kho trải dài qua 2 lô khác nhau theo date gần nhất")
    void testFefoMultiBatchDeduction() {
        String medId = "FEFO_CASE1_MED";
        Medicine med = new Medicine();
        med.setId(medId);
        med.setName("Panadol Đa Lô FEFO");
        med.setCategory("Thuốc giảm đau");
        med.setPrice(5000.0);
        med.setBarcode("8930001112221");
        medicineRepository.save(med);

        LocalDate today = LocalDate.now();

        // Lô A date gần: còn 5 hộp (hạn sau 10 ngày)
        MedicineBatch batchA = new MedicineBatch();
        batchA.setId("BATCH_FEFO_A");
        batchA.setBatchNumber(101);
        batchA.setMedicine(med);
        batchA.setQuantity(5);
        batchA.setExpiryDate(today.plusDays(10));
        batchA.setPurchasePrice(3000.0);
        batchRepository.save(batchA);

        // Lô B date xa hơn: còn 10 hộp (hạn sau 90 ngày)
        MedicineBatch batchB = new MedicineBatch();
        batchB.setId("BATCH_FEFO_B");
        batchB.setBatchNumber(102);
        batchB.setMedicine(med);
        batchB.setQuantity(10);
        batchB.setExpiryDate(today.plusDays(90));
        batchB.setPurchasePrice(3000.0);
        batchRepository.save(batchB);

        // Khách mua 8 hộp -> Mong muốn: Lấy hết 5 hộp lô A và lấy thêm 3 hộp từ lô B
        PosCheckoutRequest request = new PosCheckoutRequest();
        request.setItems(List.of(new OrderItemRequest(medId, 8)));
        request.setCustomerPaid(40000.0); // 8 * 5000 = 40,000
        request.setDiscountAmount(0.0);

        PosCheckoutResponse response = posService.checkout(request, null);

        // Assertions kết quả trả về
        assertNotNull(response);
        assertEquals(40000.0, response.getTotalAmount(), "Tổng tiền phải bằng 8 * 5000 = 40000");
        assertEquals(2, response.getAllocations().size(), "Phải có 2 phân bổ chi tiết từ 2 lô");

        // Kiểm tra phân bổ Lô A (xuất trước)
        var allocA = response.getAllocations().stream()
                .filter(a -> a.getBatchId().equals("BATCH_FEFO_A"))
                .findFirst().orElseThrow();
        assertEquals(5, allocA.getQuantityAllocated(), "Lô A phải bị lấy hết 5 hộp");

        // Kiểm tra phân bổ Lô B (xuất sau)
        var allocB = response.getAllocations().stream()
                .filter(a -> a.getBatchId().equals("BATCH_FEFO_B"))
                .findFirst().orElseThrow();
        assertEquals(3, allocB.getQuantityAllocated(), "Lô B phải bị lấy 3 hộp");

        // Kiểm tra tồn kho thực tế trong CSDL
        MedicineBatch updatedA = batchRepository.findById("BATCH_FEFO_A").orElseThrow();
        MedicineBatch updatedB = batchRepository.findById("BATCH_FEFO_B").orElseThrow();

        assertEquals(0, updatedA.getQuantity(), "Lô A sau khi bán phải còn 0");
        assertEquals(7, updatedB.getQuantity(), "Lô B sau khi bán phải còn 7 (10 - 3)");
    }

    @Test
    @DisplayName("FEFO Case 2: Tự động bỏ qua Lô đã hết hạn dù lô đó còn tồn kho")
    void testFefoSkipExpiredBatch() {
        String medId = "FEFO_CASE2_MED";
        Medicine med = new Medicine();
        med.setId(medId);
        med.setName("Paracetamol Hết Hạn FEFO");
        med.setCategory("Thuốc giảm đau");
        med.setPrice(4000.0);
        med.setBarcode("8930001112222");
        medicineRepository.save(med);

        LocalDate today = LocalDate.now();

        // Lô C đã hết hạn (hạn 5 ngày trước), còn 20 hộp
        MedicineBatch batchExpired = new MedicineBatch();
        batchExpired.setId("BATCH_EXPIRED_2");
        batchExpired.setBatchNumber(103);
        batchExpired.setMedicine(med);
        batchExpired.setQuantity(20);
        batchExpired.setExpiryDate(today.minusDays(5)); // Đã quá hạn!
        batchExpired.setPurchasePrice(2000.0);
        batchRepository.save(batchExpired);

        // Lô D còn hạn (hạn 60 ngày tới), còn 6 hộp
        MedicineBatch batchValid = new MedicineBatch();
        batchValid.setId("BATCH_VALID_2");
        batchValid.setBatchNumber(104);
        batchValid.setMedicine(med);
        batchValid.setQuantity(6);
        batchValid.setExpiryDate(today.plusDays(60));
        batchValid.setPurchasePrice(2000.0);
        batchRepository.save(batchValid);

        // Khách mua 4 hộp
        PosCheckoutRequest request = new PosCheckoutRequest();
        request.setItems(List.of(new OrderItemRequest(medId, 4)));
        request.setCustomerPaid(16000.0);

        PosCheckoutResponse response = posService.checkout(request, null);

        assertNotNull(response);
        assertEquals(1, response.getAllocations().size(), "Chỉ được phân bổ từ đúng 1 lô còn hạn");
        assertEquals("BATCH_VALID_2", response.getAllocations().get(0).getBatchId(), "Phải lấy từ lô BATCH_VALID_2");
        assertEquals(4, response.getAllocations().get(0).getQuantityAllocated());

        // Kiểm tra tồn kho
        MedicineBatch checkExpired = batchRepository.findById("BATCH_EXPIRED_2").orElseThrow();
        MedicineBatch checkValid = batchRepository.findById("BATCH_VALID_2").orElseThrow();

        assertEquals(20, checkExpired.getQuantity(), "Lô hết hạn tuyệt đối KHÔNG bị trừ số lượng");
        assertEquals(2, checkValid.getQuantity(), "Lô còn hạn bị trừ từ 6 xuống còn 2");
    }

    @Test
    @DisplayName("FEFO Case 3: Báo lỗi InsufficientStockException khi tổng tồn khả dụng còn hạn không đủ")
    void testFefoInsufficientStockThrowsException() {
        String medId = "FEFO_CASE3_MED";
        Medicine med = new Medicine();
        med.setId(medId);
        med.setName("Kháng Sinh Thiếu Hàng FEFO");
        med.setCategory("Kháng sinh");
        med.setPrice(10000.0);
        med.setBarcode("8930001112223");
        medicineRepository.save(med);

        LocalDate today = LocalDate.now();

        MedicineBatch batchOnly = new MedicineBatch();
        batchOnly.setId("BATCH_FEFO_ONLY_3");
        batchOnly.setBatchNumber(105);
        batchOnly.setMedicine(med);
        batchOnly.setQuantity(3); // Chỉ có 3 hộp
        batchOnly.setExpiryDate(today.plusDays(30));
        batchOnly.setPurchasePrice(6000.0);
        batchRepository.save(batchOnly);

        // Khách yêu cầu mua 5 hộp nhưng chỉ còn 3 hộp
        PosCheckoutRequest request = new PosCheckoutRequest();
        request.setItems(List.of(new OrderItemRequest(medId, 5)));
        request.setCustomerPaid(50000.0);

        InsufficientStockException exception = assertThrows(
                InsufficientStockException.class,
                () -> posService.checkout(request, null),
                "Hệ thống phải ném ngoại lệ InsufficientStockException khi thiếu hàng"
        );

        assertTrue(exception.getMessage().contains("không đủ số lượng tồn kho khả dụng"),
                "Nội dung thông báo lỗi phải thể hiện rõ không đủ hàng tồn khả dụng");

        // Đảm bảo số lượng trong kho giữ nguyên 3 hộp
        MedicineBatch batchCheck = batchRepository.findById("BATCH_FEFO_ONLY_3").orElseThrow();
        assertEquals(3, batchCheck.getQuantity(), "Giao dịch lỗi không được trừ tồn kho");
    }
}
