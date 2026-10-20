package com.nhathuoc.pharmacy_backend.api;

import com.nhathuoc.pharmacy_backend.entity.Customer;
import com.nhathuoc.pharmacy_backend.repository.CustomerRepository;
import org.springframework.context.annotation.Profile;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/customers")
@Profile({"local", "sqlserver"})
public class CustomerController {

    private final CustomerRepository repository;

    public CustomerController(CustomerRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<CustomerResponse> list() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public CustomerResponse get(@PathVariable String id) {
        return toResponse(find(id));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<CustomerResponse> create(@RequestBody CustomerRequest request) {
        validate(request, true);
        if (repository.existsById(request.id())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã khách hàng đã tồn tại");
        }
        Customer customer = new Customer();
        customer.setId(request.id().trim());
        customer.setCreatedAt(LocalDate.now());
        applyRequest(customer, request);
        Customer saved = repository.saveAndFlush(customer);
        return ResponseEntity.created(URI.create("/api/customers/" + saved.getId())).body(toResponse(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public CustomerResponse update(@PathVariable String id, @RequestBody CustomerRequest request) {
        validate(request, false);
        Customer customer = find(id);
        applyRequest(customer, request);
        return toResponse(repository.saveAndFlush(customer));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable String id) {
        try {
            repository.delete(find(id));
            repository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Khách hàng đang được đơn hàng sử dụng");
        }
        return ResponseEntity.noContent().build();
    }

    private void validate(CustomerRequest request, boolean requireId) {
        if (request == null || request.name() == null || request.name().isBlank() || request.name().length() > 50
                || (requireId && (request.id() == null || request.id().isBlank() || request.id().length() > 50))
                || (request.phone() != null && request.phone().length() > 20)
                || (request.address() != null && request.address().length() > 50)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin khách hàng không hợp lệ");
        }
    }

    private void applyRequest(Customer customer, CustomerRequest request) {
        customer.setName(request.name().trim());
        customer.setPhone(request.phone());
        customer.setAddress(request.address());
    }

    private Customer find(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy khách hàng"));
    }

    private CustomerResponse toResponse(Customer customer) {
        return new CustomerResponse(customer.getId(), customer.getName(), customer.getPhone(), customer.getAddress(), customer.getCreatedAt());
    }
}