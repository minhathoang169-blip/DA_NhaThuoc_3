package com.nhathuoc.pharmacy_backend.api;

import java.time.LocalDate;

public record CustomerResponse(String id, String name, String phone, String address, LocalDate createdAt) {
}