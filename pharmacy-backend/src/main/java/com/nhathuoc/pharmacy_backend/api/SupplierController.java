package com.nhathuoc.pharmacy_backend.api;

import com.nhathuoc.pharmacy_backend.entity.Supplier;
import com.nhathuoc.pharmacy_backend.repository.SupplierRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api/suppliers")
@Profile({"local", "sqlserver"})
public class SupplierController {

    private final SupplierRepository repository;

    public SupplierController(SupplierRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<SupplierResponse> list() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public SupplierResponse get(@PathVariable String id) {
        return toResponse(find(id));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<SupplierResponse> create(@RequestBody SupplierRequest request) {
        validate(request, true);
        if (repository.existsById(request.id())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã nhà cung cấp đã tồn tại");
        }
        Supplier supplier = new Supplier();
        supplier.setId(request.id().trim());
        applyRequest(supplier, request);
        Supplier saved = repository.saveAndFlush(supplier);
        return ResponseEntity.created(URI.create("/api/suppliers/" + saved.getId())).body(toResponse(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public SupplierResponse update(@PathVariable String id, @RequestBody SupplierRequest request) {
        validate(request, false);
        Supplier supplier = find(id);
        applyRequest(supplier, request);
        return toResponse(repository.saveAndFlush(supplier));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable String id) {
        try {
            repository.delete(find(id));
            repository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nhà cung cấp đang có liên kết phân phối hoặc phiếu nhập");
        }
        return ResponseEntity.noContent().build();
    }

    private void validate(SupplierRequest request, boolean requireId) {
        if (request == null || request.name() == null || request.name().isBlank() || request.name().length() > 50
                || (requireId && (request.id() == null || request.id().isBlank() || request.id().length() > 50))
                || (request.phone() != null && request.phone().length() > 20)
                || (request.address() != null && request.address().length() > 50)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin nhà cung cấp không hợp lệ");
        }
    }

    private void applyRequest(Supplier supplier, SupplierRequest request) {
        supplier.setName(request.name().trim());
        supplier.setPhone(request.phone());
        supplier.setAddress(request.address());
    }

    private Supplier find(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhà cung cấp"));
    }

    private SupplierResponse toResponse(Supplier supplier) {
        return new SupplierResponse(supplier.getId(), supplier.getName(), supplier.getPhone(), supplier.getAddress());
    }
}