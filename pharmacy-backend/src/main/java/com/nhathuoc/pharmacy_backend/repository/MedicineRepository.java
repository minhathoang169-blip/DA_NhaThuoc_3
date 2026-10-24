package com.nhathuoc.pharmacy_backend.repository;

import com.nhathuoc.pharmacy_backend.entity.Medicine;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MedicineRepository extends JpaRepository<Medicine, String> {

    List<Medicine> findAllByOrderByNameAsc();

    Optional<Medicine> findByBarcode(String barcode);

    @Query("SELECT m FROM Medicine m WHERE " +
           "LOWER(m.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "(m.barcode IS NOT NULL AND LOWER(m.barcode) LIKE LOWER(CONCAT('%', :query, '%'))) OR " +
           "(m.activeIngredient IS NOT NULL AND LOWER(m.activeIngredient.name) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Medicine> searchByNameBarcodeOrActiveIngredient(@Param("query") String query);

    @Query("SELECT m FROM Medicine m WHERE m.activeIngredient.id = :activeIngredientId AND m.id <> :excludeMedicineId")
    List<Medicine> findSubstitutesByActiveIngredient(
            @Param("activeIngredientId") Long activeIngredientId,
            @Param("excludeMedicineId") String excludeMedicineId
    );
}