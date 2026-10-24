package com.nhathuoc.pharmacy_backend;

import com.nhathuoc.pharmacy_backend.dto.OrderItemRequest;
import com.nhathuoc.pharmacy_backend.dto.PosCheckoutRequest;
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
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class PosConcurrencyTest {

    @Autowired
    private PosService posService;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private MedicineBatchRepository batchRepository;

    @Test
    @DisplayName("Concurrency Test: 10 quầy POS cùng mua sản phẩm duy nhất còn 1 hộp -> ĐÚNG 1 thành công, 9 lỗi, tồn kho = 0")
    void testConcurrentCheckoutRaceCondition() throws InterruptedException {
        // 1. Chuẩn bị sản phẩm và lô duy nhất có đúng 1 sản phẩm
        String medicineId = "MED_RACE_CONC";
        String batchId = "LOT_RACE_CONC";

        Medicine raceMedicine = new Medicine();
        raceMedicine.setId(medicineId);
        raceMedicine.setName("Thuốc Đua Đa Luồng Kháng Độc");
        raceMedicine.setCategory("Kháng sinh đặc trị");
        raceMedicine.setPrice(100000.0);
        raceMedicine.setBarcode("8939998887776");
        medicineRepository.save(raceMedicine);

        MedicineBatch raceBatch = new MedicineBatch();
        raceBatch.setId(batchId);
        raceBatch.setBatchNumber(999);
        raceBatch.setMedicine(raceMedicine);
        raceBatch.setQuantity(1); // TỒN KHO DUY NHẤT 1 HỘP
        raceBatch.setExpiryDate(LocalDate.now().plusMonths(12));
        raceBatch.setPurchasePrice(70000.0);
        batchRepository.save(raceBatch);

        // 2. Thiết lập 10 thread đồng thời kích hoạt tại cùng 1 thời điểm
        int numberOfThreads = 10;
        ExecutorService executorService = Executors.newFixedThreadPool(numberOfThreads);
        CountDownLatch readyLatch = new CountDownLatch(numberOfThreads); // Đợi cả 10 thread sẵn sàng
        CountDownLatch startLatch = new CountDownLatch(1);                 // Súng lệnh phát nổ cùng lúc
        CountDownLatch doneLatch = new CountDownLatch(numberOfThreads);  // Đợi cả 10 thread hoàn thành

        AtomicInteger successCounter = new AtomicInteger(0);
        AtomicInteger outOfStockFailures = new AtomicInteger(0);
        AtomicInteger unexpectedErrors = new AtomicInteger(0);

        for (int i = 0; i < numberOfThreads; i++) {
            final int cashierId = i + 1;
            executorService.submit(() -> {
                readyLatch.countDown();
                try {
                    // Chờ tiếng còi xuất phát để cả 10 thread cùng gọi API vào đúng 1 millisecond
                    startLatch.await();

                    PosCheckoutRequest request = new PosCheckoutRequest();
                    request.setItems(List.of(new OrderItemRequest(medicineId, 1)));
                    request.setCustomerPaid(100000.0);
                    request.setCustomerName("Quầy thu ngân #" + cashierId);

                    posService.checkout(request, null);
                    successCounter.incrementAndGet();
                } catch (InsufficientStockException ex) {
                    // Đúng kịch bản: Hết hàng khi quầy khác đã mua trước
                    outOfStockFailures.incrementAndGet();
                } catch (Exception ex) {
                    // Lỗi không mong đợi
                    unexpectedErrors.incrementAndGet();
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        // Chờ cả 10 luồng chuẩn bị xong
        readyLatch.await(5, TimeUnit.SECONDS);

        // BẮT ĐẦU: 10 quầy cùng bấm nút thanh toán đồng thời
        startLatch.countDown();

        // Chờ tất cả thực thi xong
        boolean finished = doneLatch.await(15, TimeUnit.SECONDS);
        executorService.shutdown();

        // 3. Kiểm chứng toàn vẹn dữ liệu (ACID & Concurrency Proof)
        assertEquals(true, finished, "Tất cả các luồng phải hoàn thành trong 15s");
        assertEquals(1, successCounter.get(), "Chỉ DUY NHẤT 1 quầy thanh toán thành công");
        assertEquals(9, outOfStockFailures.get(), "Chính xác 9 quầy còn lại phải nhận InsufficientStockException");
        assertEquals(0, unexpectedErrors.get(), "Không được có bất kỳ lỗi xung đột không kiểm soát nào");

        // 4. Kiểm tra tồn kho trong cơ sở dữ liệu: Phải bằng 0, TUYỆT ĐỐI KHÔNG BỊ ÂM KHO
        MedicineBatch finalBatch = batchRepository.findById(batchId).orElseThrow();
        assertEquals(0, finalBatch.getQuantity(), "Số lượng tồn kho cuối cùng phải chính xác là 0 (Không bao giờ âm)");
    }
}
