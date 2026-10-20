package com.nhathuoc.pharmacy_backend.api;

import com.nhathuoc.pharmacy_backend.entity.Employee;
import com.nhathuoc.pharmacy_backend.repository.EmployeeRepository;
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
@RequestMapping("/api/employees")
@Profile({"local", "sqlserver"})
public class EmployeeController {

    private final EmployeeRepository repository;

    public EmployeeController(EmployeeRepository repository) {
        this.repository = repository;
    }

    @GetMapping
    public List<EmployeeResponse> list() {
        return repository.findAll().stream().map(this::toResponse).toList();
    }

    @GetMapping("/{id}")
    public EmployeeResponse get(@PathVariable String id) {
        return toResponse(find(id));
    }

    @PostMapping
    @Transactional
    public ResponseEntity<EmployeeResponse> create(@RequestBody EmployeeRequest request) {
        validate(request, true);
        if (repository.existsById(request.id())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Mã nhân viên đã tồn tại");
        }
        Employee employee = new Employee();
        employee.setId(request.id().trim());
        applyRequest(employee, request);
        Employee saved = repository.saveAndFlush(employee);
        return ResponseEntity.created(URI.create("/api/employees/" + saved.getId())).body(toResponse(saved));
    }

    @PutMapping("/{id}")
    @Transactional
    public EmployeeResponse update(@PathVariable String id, @RequestBody EmployeeRequest request) {
        validate(request, false);
        Employee employee = find(id);
        applyRequest(employee, request);
        return toResponse(repository.saveAndFlush(employee));
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable String id) {
        try {
            repository.delete(find(id));
            repository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Nhân viên đang được phiếu nhập hoặc đơn hàng sử dụng");
        }
        return ResponseEntity.noContent().build();
    }

    private void validate(EmployeeRequest request, boolean requireId) {
        if (request == null || request.name() == null || request.name().isBlank() || request.name().length() > 50
                || (requireId && (request.id() == null || request.id().isBlank() || request.id().length() > 50))
                || (request.phone() != null && request.phone().length() > 20)
                || (request.role() != null && request.role().length() > 50)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Thông tin nhân viên không hợp lệ");
        }
    }

    private void applyRequest(Employee employee, EmployeeRequest request) {
        employee.setName(request.name().trim());
        employee.setPhone(request.phone());
        employee.setBirthDate(request.birthDate());
        employee.setRole(request.role());
        employee.setStartDate(request.startDate());
    }

    private Employee find(String id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Không tìm thấy nhân viên"));
    }

    private EmployeeResponse toResponse(Employee employee) {
        return new EmployeeResponse(
                employee.getId(),
                employee.getName(),
                employee.getPhone(),
                employee.getBirthDate(),
                employee.getRole(),
                employee.getStartDate()
        );
    }
}