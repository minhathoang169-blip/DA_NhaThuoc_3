package com.nhathuoc.pharmacy_backend.api;

import java.time.LocalDate;

public record EmployeeRequest(
        String id,
        String name,
        String phone,
        LocalDate birthDate,
        String role,
        LocalDate startDate
) {
}