package com.nhathuoc.pharmacy_backend.repository;

import com.nhathuoc.pharmacy_backend.entity.ActiveIngredient;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ActiveIngredientRepository extends JpaRepository<ActiveIngredient, Long> {
}