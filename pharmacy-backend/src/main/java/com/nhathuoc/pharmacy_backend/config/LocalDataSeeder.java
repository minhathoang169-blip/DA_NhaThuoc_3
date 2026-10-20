package com.nhathuoc.pharmacy_backend.config;

import com.nhathuoc.pharmacy_backend.entity.Medicine;
import com.nhathuoc.pharmacy_backend.entity.MedicineBatch;
import com.nhathuoc.pharmacy_backend.repository.MedicineBatchRepository;
import com.nhathuoc.pharmacy_backend.repository.MedicineRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import java.time.LocalDate;
import java.util.List;

@Configuration
@Profile("local")
public class LocalDataSeeder {

    @Bean
    CommandLineRunner seedLocalMedicines(
            MedicineRepository medicineRepository,
            MedicineBatchRepository batchRepository
    ) {
        return args -> {
            if (medicineRepository.count() > 0) {
                return;
            }

                Medicine paracetamol = saveMedicine(medicineRepository, "SP001", "Paracetamol 500 mg", "Thuốc giảm đau", 1200);
                Medicine vitamin = saveMedicine(medicineRepository, "SP002", "Vitamin C 500 mg", "Thực phẩm chức năng", 900);
                Medicine allergy = saveMedicine(medicineRepository, "SP003", "Cetirizine 10 mg", "Thuốc dị ứng", 1800);

            batchRepository.saveAll(List.of(
                    createBatch(paracetamol, "LOCAL-PA-01", 202601, 84, 18, 800),
                    createBatch(paracetamol, "LOCAL-PA-02", 202602, 36, 14, 800),
                    createBatch(vitamin, "LOCAL-VC-01", 202603, 12, 5, 600),
                    createBatch(allergy, "LOCAL-CE-01", 202604, 7, 2, 1000)
            ));
        };
    }

    private Medicine saveMedicine(
            MedicineRepository repository,
            String id,
            String name,
            String category,
            double price
    ) {
        Medicine medicine = new Medicine();
        medicine.setId(id);
        medicine.setName(name);
        medicine.setCategory(category);
        medicine.setPrice(price);
        return repository.save(medicine);
    }

    private MedicineBatch createBatch(Medicine medicine, String id, int batchNumber, int quantity, int expiryMonths, double purchasePrice) {
        MedicineBatch batch = new MedicineBatch();
        batch.setId(id);
        batch.setMedicine(medicine);
        batch.setBatchNumber(batchNumber);
        batch.setQuantity(quantity);
        batch.setExpiryDate(LocalDate.now().plusMonths(expiryMonths));
        batch.setPurchasePrice(purchasePrice);
        return batch;
    }
}