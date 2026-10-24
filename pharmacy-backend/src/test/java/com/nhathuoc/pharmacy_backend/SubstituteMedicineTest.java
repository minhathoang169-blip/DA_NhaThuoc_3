package com.nhathuoc.pharmacy_backend;

import com.nhathuoc.pharmacy_backend.dto.SubstituteMedicineResponse;
import com.nhathuoc.pharmacy_backend.entity.ActiveIngredient;
import com.nhathuoc.pharmacy_backend.entity.Medicine;
import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import com.nhathuoc.pharmacy_backend.repository.ActiveIngredientRepository;
import com.nhathuoc.pharmacy_backend.repository.MedicineBatchRepository;
import com.nhathuoc.pharmacy_backend.repository.MedicineRepository;
import com.nhathuoc.pharmacy_backend.service.MedicineService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDate;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
class SubstituteMedicineTest {

    @Autowired
    private MedicineService medicineService;

    @Autowired
    private MedicineRepository medicineRepository;

    @Autowired
    private ActiveIngredientRepository activeIngredientRepository;

    @Autowired
    private MedicineBatchRepository batchRepository;

    @Test
    @DisplayName("Gợi ý thuốc thay thế: Chỉ trả về thuốc cùng hoạt chất có TỒN KHO > 0, loại bỏ thuốc hết hàng hoặc khác hoạt chất")
    void testGetSubstitutesFiltering() {
        LocalDate today = LocalDate.now();

        // 1. Tạo hoạt chất: Ibuprofen
        ActiveIngredient ibuprofen = new ActiveIngredient();
        ibuprofen.setName("Ibuprofen 400mg");
        ibuprofen.setDescription("Kháng viêm không steroid");
        ibuprofen = activeIngredientRepository.save(ibuprofen);

        // Tạo hoạt chất khác: Paracetamol
        ActiveIngredient paracetamol = new ActiveIngredient();
        paracetamol.setName("Paracetamol Khác");
        paracetamol = activeIngredientRepository.save(paracetamol);

        // 2. Thuốc gốc đang xem (hết hàng)
        Medicine medOriginal = new Medicine("IBU_01", "Alaxan Cũ", "Kháng viêm", 4000, "893111", ibuprofen);
        medicineRepository.save(medOriginal);

        // Thuốc thay thế 1: Cùng hoạt chất Ibuprofen, CÒN HÀNG (15 hộp) -> MONG ĐỢI TRẢ VỀ
        Medicine medSubInStock = new Medicine("IBU_02", "Gofen 400 Clear", "Kháng viêm", 5500, "893222", ibuprofen);
        medicineRepository.save(medSubInStock);
        MedicineBatch batchInStock = new MedicineBatch("LOT_IBU_IN", 301, medSubInStock, 15, today.plusMonths(12), 3500);
        batchRepository.save(batchInStock);

        // Thuốc thay thế 2: Cùng hoạt chất Ibuprofen, HẾT HÀNG (tồn = 0) -> LOẠI BỎ
        Medicine medSubOutOfStock = new Medicine("IBU_03", "Brufen Hết Hàng", "Kháng viêm", 3800, "893333", ibuprofen);
        medicineRepository.save(medSubOutOfStock);
        MedicineBatch batchOutOfStock = new MedicineBatch("LOT_IBU_OUT", 302, medSubOutOfStock, 0, today.plusMonths(12), 2500);
        batchRepository.save(batchOutOfStock);

        // Thuốc 3: KHÁC HOẠT CHẤT (Paracetamol), còn hàng 100 hộp -> TUYỆT ĐỐI LOẠI BỎ
        Medicine medDifferentAi = new Medicine("DIFF_01", "Thuốc Khác Hoạt Chất", "Giảm đau", 2000, "893444", paracetamol);
        medicineRepository.save(medDifferentAi);
        MedicineBatch batchDiff = new MedicineBatch("LOT_DIFF", 303, medDifferentAi, 100, today.plusMonths(12), 1000);
        batchRepository.save(batchDiff);

        // 3. Thực thi tìm kiếm thuốc thay thế cho medOriginal ("IBU_01")
        List<SubstituteMedicineResponse> substitutes = medicineService.getSubstitutes("IBU_01");

        // 4. Assertions
        assertNotNull(substitutes);
        assertEquals(1, substitutes.size(), "Chỉ duy nhất có 1 thuốc thay thế hợp lệ thỏa mãn (cùng hoạt chất và còn hàng)");

        SubstituteMedicineResponse chosen = substitutes.get(0);
        assertEquals("IBU_02", chosen.getId(), "Phải gợi ý đúng Gofen 400 Clear");
        assertEquals("Gofen 400 Clear", chosen.getName());
        assertEquals("Ibuprofen 400mg", chosen.getActiveIngredientName());
        assertEquals(15, chosen.getAvailableStock(), "Tồn kho khả dụng phải là 15 hộp");
        assertTrue(chosen.getAvailableStock() > 0, "Thuốc gợi ý bắt buộc phải có tồn khả dụng > 0");
    }
}
