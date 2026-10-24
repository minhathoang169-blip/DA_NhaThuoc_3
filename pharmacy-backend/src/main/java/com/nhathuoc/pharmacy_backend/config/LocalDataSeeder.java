package com.nhathuoc.pharmacy_backend.config;

import com.nhathuoc.pharmacy_backend.entity.*;
import com.nhathuoc.pharmacy_backend.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class LocalDataSeeder {

    @Bean
    CommandLineRunner seedInitialData(
            UserRepository userRepository,
            ActiveIngredientRepository activeIngredientRepository,
            MedicineRepository medicineRepository,
            MedicineBatchRepository batchRepository,
            InvoiceRepository invoiceRepository,
            InvoiceDetailRepository invoiceDetailRepository,
            OnlineOrderRepository onlineOrderRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            // 1. Khởi tạo tài khoản thực tế (ADMIN, PHARMACIST, CUSTOMER)
            User adminUser;
            User pharmacistUser;
            User customerUser;

            if (userRepository.count() == 0) {
                User admin = new User();
                admin.setUsername("admin");
                admin.setPassword(passwordEncoder.encode("admin123"));
                admin.setFullName("DS. CKII Lê Hoàng Nam");
                admin.setEmail("admin@nhathuocnamviet.vn");
                admin.setPhone("0912345678");
                admin.setRole("ADMIN");

                User pharmacist = new User();
                pharmacist.setUsername("pharmacist");
                pharmacist.setPassword(passwordEncoder.encode("pharmacist123"));
                pharmacist.setFullName("DS. Trần Minh Anh");
                pharmacist.setEmail("minhanh.ds@nhathuocnamviet.vn");
                pharmacist.setPhone("0987654321");
                pharmacist.setRole("PHARMACIST");

                User customer = new User();
                customer.setUsername("customer");
                customer.setPassword(passwordEncoder.encode("customer123"));
                customer.setFullName("Nguyễn Hoàng Long");
                customer.setEmail("long.nguyen@gmail.com");
                customer.setPhone("0903112233");
                customer.setRole("CUSTOMER");

                adminUser = userRepository.save(admin);
                pharmacistUser = userRepository.save(pharmacist);
                customerUser = userRepository.save(customer);
            } else {
                adminUser = userRepository.findByUsername("admin").orElse(null);
                pharmacistUser = userRepository.findByUsername("pharmacist").orElse(null);
                customerUser = userRepository.findByUsername("customer").orElse(null);
            }

            // 2. Khởi tạo danh mục hoạt chất & thuốc thực tế chuẩn Dược thư
            if (medicineRepository.count() == 0) {
                ActiveIngredient paracetamol = saveAi(activeIngredientRepository, "Paracetamol (Acetaminophen)", "Hạ sốt, giảm đau thông thường an toàn cho dạ dày.");
                ActiveIngredient ibuprofen = saveAi(activeIngredientRepository, "Ibuprofen", "Kháng viêm non-steroid NSAID giảm đau mức độ vừa.");
                ActiveIngredient amoxClav = saveAi(activeIngredientRepository, "Amoxicillin + Acid Clavulanic", "Kháng sinh phổ rộng beta-lactam kết hợp chất ức chế beta-lactamase.");
                ActiveIngredient cefixime = saveAi(activeIngredientRepository, "Cefixime", "Kháng sinh Cephalosporin thế hệ 3 trị nhiễm khuẩn hô hấp.");
                ActiveIngredient cetirizine = saveAi(activeIngredientRepository, "Cetirizine diHCl", "Kháng histamin H1 điều trị dị ứng, mề đay.");
                ActiveIngredient esomeprazole = saveAi(activeIngredientRepository, "Esomeprazole", "Ức chế bơm proton PPI điều trị trào ngược dạ dày thực quản.");
                ActiveIngredient berberin = saveAi(activeIngredientRepository, "Berberin chloride", "Kháng khuẩn tự nhiên điều trị tiêu chảy, nhiễm trùng tiêu hóa.");
                ActiveIngredient ivyLeaf = saveAi(activeIngredientRepository, "Cao khô lá thường xuân", "Trị ho, long đờm thảo dược tự nhiên.");
                ActiveIngredient vitC = saveAi(activeIngredientRepository, "Vitamin C + Kẽm (Zinc)", "Tăng cường sức đề kháng, chống oxy hóa.");
                ActiveIngredient nacl = saveAi(activeIngredientRepository, "Natri Clorid 0.9%", "Dung dịch muối đẳng trương rửa mắt, mũi.");

                Medicine m1 = new Medicine("SP001", "Panadol Extra đỏ (Hộp 180 viên / 15 vỉ)", "Thuốc giảm đau", 245000, "8935001800012", paracetamol);
                Medicine m2 = new Medicine("SP002", "Hapacol 650 (Hộp 100 viên / 10 vỉ)", "Thuốc giảm đau", 135000, "8935001800029", paracetamol);
                Medicine m3 = new Medicine("SP003", "Efferalgan 500mg sủi (Tuýp 16 viên)", "Thuốc hạ sốt sủi", 88000, "8935001800036", paracetamol);
                Medicine m4 = new Medicine("SP004", "Gofen 400 Clear (Hộp 30 viên)", "Thuốc kháng viêm", 85000, "8935001800043", ibuprofen);
                Medicine m5 = new Medicine("SP005", "Alaxan (Hộp 100 viên / 10 vỉ)", "Thuốc kháng viêm", 125000, "8935001800050", ibuprofen);
                Medicine m6 = new Medicine("SP006", "Augmentin 1g (Hộp 14 viên / 2 vỉ)", "Thuốc kháng sinh", 275000, "8935001800067", amoxClav);
                Medicine m7 = new Medicine("SP007", "Claminat 1g (Hộp 14 viên / 2 vỉ)", "Thuốc kháng sinh", 195000, "8935001800074", amoxClav);
                Medicine m8 = new Medicine("SP008", "Cefixim 200mg Mekophar (Hộp 20 viên)", "Thuốc kháng sinh", 98000, "8935001800081", cefixime);
                Medicine m9 = new Medicine("SP009", "Zyrtec 10mg (Hộp 10 viên / 1 vỉ)", "Thuốc dị ứng", 92000, "8935001800098", cetirizine);
                Medicine m10 = new Medicine("SP010", "Cetirizin STADA 10mg (Hộp 50 viên)", "Thuốc dị ứng", 78000, "8935001800104", cetirizine);
                Medicine m11 = new Medicine("SP011", "Nexium Mups 40mg (Hộp 14 viên)", "Thuốc dạ dày", 375000, "8935001800111", esomeprazole);
                Medicine m12 = new Medicine("SP012", "Berberin BM 100mg (Lọ 100 viên)", "Thuốc tiêu hóa", 38000, "8935001800128", berberin);
                Medicine m13 = new Medicine("SP013", "Siro ho Prospan 100ml (Chai 100ml)", "Thuốc ho thảo dược", 135000, "8935001800135", ivyLeaf);
                Medicine m14 = new Medicine("SP014", "Berocca Performance sủi vị cam (Tuýp 10 viên)", "Thực phẩm chức năng", 92000, "8935001800142", vitC);
                Medicine m15 = new Medicine("SP015", "Dung dịch nhỏ mắt Natri Clorid 0.9% (Lọ 10ml)", "Nước muối sinh lý", 5000, "8935001800159", nacl);

                medicineRepository.saveAll(List.of(m1, m2, m3, m4, m5, m6, m7, m8, m9, m10, m11, m12, m13, m14, m15));

                LocalDate today = LocalDate.now();

                // Các lô thuốc đa dạng date (kèm lô cận hạn < 15 ngày, < 30 ngày)
                MedicineBatch b1 = new MedicineBatch("LOT-PA-2601", 202601, m1, 180, today.plusMonths(24), 195000);
                MedicineBatch b2 = new MedicineBatch("LOT-PA-2602", 202602, m1, 25, today.plusDays(10), 195000); // Critical: < 10 ngày
                MedicineBatch b3 = new MedicineBatch("LOT-HP-2601", 202603, m2, 150, today.plusMonths(18), 95000);
                MedicineBatch b4 = new MedicineBatch("LOT-EF-2601", 202604, m3, 40, today.plusDays(25), 65000); // Warning: < 25 ngày
                MedicineBatch b5 = new MedicineBatch("LOT-GF-2601", 202605, m4, 80, today.plusMonths(12), 62000);
                MedicineBatch b6 = new MedicineBatch("LOT-AX-OLD", 202501, m5, 15, today.minusDays(5), 85000); // Đã hết hạn (FEFO tự bỏ qua)
                MedicineBatch b7 = new MedicineBatch("LOT-AX-2601", 202602, m5, 85, today.plusMonths(14), 88000);
                MedicineBatch b8 = new MedicineBatch("LOT-AG-2601", 202606, m6, 60, today.plusMonths(16), 220000);
                MedicineBatch b9 = new MedicineBatch("LOT-CL-2601", 202607, m7, 120, today.plusMonths(12), 145000);
                MedicineBatch b10 = new MedicineBatch("LOT-CF-2601", 202608, m8, 90, today.plusMonths(14), 72000);
                MedicineBatch b11 = new MedicineBatch("LOT-ZY-2601", 202609, m9, 70, today.plusMonths(20), 68000);
                MedicineBatch b12 = new MedicineBatch("LOT-CT-2601", 202610, m10, 110, today.plusMonths(15), 55000);
                MedicineBatch b13 = new MedicineBatch("LOT-NX-2601", 202611, m11, 50, today.plusMonths(10), 290000);
                MedicineBatch b14 = new MedicineBatch("LOT-BB-2601", 202612, m12, 250, today.plusMonths(24), 25000);
                MedicineBatch b15 = new MedicineBatch("LOT-PS-2601", 202613, m13, 85, today.plusMonths(8), 98000);
                MedicineBatch b16 = new MedicineBatch("LOT-BC-2601", 202614, m14, 140, today.plusMonths(15), 68000);
                MedicineBatch b17 = new MedicineBatch("LOT-NC-2601", 202615, m15, 500, today.plusMonths(24), 3200);

                batchRepository.saveAll(List.of(b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15, b16, b17));
            }

            // 3. Khởi tạo đơn hàng Mobile App mẫu nếu chưa có
            if (onlineOrderRepository.count() == 0) {
                OnlineOrder o1 = new OnlineOrder();
                o1.setOrderNumber("MOB-2024-9981");
                o1.setOrderDate(LocalDateTime.now().minusMinutes(25));
                o1.setReceiverName("Nguyễn Văn Bình");
                o1.setReceiverPhone("0918.234.882");
                o1.setShippingAddress("Tòa S2.05 Vinhome Grand Park, Q.9, TP.Thủ Đức");
                o1.setStatus("PENDING");
                o1.setTotalAmount(845000);
                o1.setCustomer(customerUser);

                OnlineOrder o2 = new OnlineOrder();
                o2.setOrderNumber("MOB-2024-9980");
                o2.setOrderDate(LocalDateTime.now().minusHours(1));
                o2.setReceiverName("Trần Thị Bích Ngọc");
                o2.setReceiverPhone("0903.882.119");
                o2.setShippingAddress("48 Đường D2, P. Tăng Nhơn Phú A, TP. Thủ Đức");
                o2.setStatus("PENDING");
                o2.setTotalAmount(215000);
                o2.setCustomer(customerUser);

                OnlineOrder o3 = new OnlineOrder();
                o3.setOrderNumber("MOB-2024-9978");
                o3.setOrderDate(LocalDateTime.now().minusHours(3));
                o3.setReceiverName("Hoàng Minh Tuấn");
                o3.setReceiverPhone("0977.102.399");
                o3.setShippingAddress("Số 12 Ngõ 84 Lê Văn Việt, Phước Long B, TP.Thủ Đức");
                o3.setStatus("CONFIRMED");
                o3.setTotalAmount(480000);
                o3.setCustomer(customerUser);

                OnlineOrder o4 = new OnlineOrder();
                o4.setOrderNumber("MOB-2024-9975");
                o4.setOrderDate(LocalDateTime.now().minusHours(6));
                o4.setReceiverName("Lê Hoàng Oanh");
                o4.setReceiverPhone("0938.441.982");
                o4.setShippingAddress("Biệt Thự 18A Đường Thảo Điền, P. Thảo Điền, TP. Thủ Đức");
                o4.setStatus("SHIPPING");
                o4.setTotalAmount(1340000);
                o4.setCustomer(customerUser);

                OnlineOrder o5 = new OnlineOrder();
                o5.setOrderNumber("MOB-2024-9970");
                o5.setOrderDate(LocalDateTime.now().minusDays(1));
                o5.setReceiverName("Phạm Đức Huy");
                o5.setReceiverPhone("0912.556.778");
                o5.setShippingAddress("102 Võ Văn Ngân, TP. Thủ Đức");
                o5.setStatus("COMPLETED");
                o5.setTotalAmount(560000);
                o5.setCustomer(customerUser);

                onlineOrderRepository.saveAll(List.of(o1, o2, o3, o4, o5));
            }
        };
    }

    private ActiveIngredient saveAi(ActiveIngredientRepository repo, String name, String desc) {
        ActiveIngredient ai = new ActiveIngredient();
        ai.setName(name);
        ai.setDescription(desc);
        return repo.save(ai);
    }
}