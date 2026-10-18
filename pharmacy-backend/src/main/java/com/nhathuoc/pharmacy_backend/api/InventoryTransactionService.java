package com.nhathuoc.pharmacy_backend.api;

import com.nhathuoc.pharmacy_backend.entity.*;
import com.nhathuoc.pharmacy_backend.repository.*;
import org.springframework.context.annotation.Profile;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@Profile({"local", "sqlserver"})
public class InventoryTransactionService {
    private final ImportReceiptRepository imports;
    private final SaleRepository sales;
    private final SupplierRepository suppliers;
    private final EmployeeRepository employees;
    private final CustomerRepository customers;
    private final MedicineBatchRepository batches;
    private final boolean updateStockInApplication;

    public InventoryTransactionService(ImportReceiptRepository imports, SaleRepository sales,
            SupplierRepository suppliers, EmployeeRepository employees, CustomerRepository customers,
            MedicineBatchRepository batches, org.springframework.core.env.Environment environment) {
        this.imports = imports;
        this.sales = sales;
        this.suppliers = suppliers;
        this.employees = employees;
        this.customers = customers;
        this.batches = batches;
        this.updateStockInApplication = List.of(environment.getActiveProfiles()).contains("local")
                || environment.getActiveProfiles().length == 0;
    }

    @Transactional(readOnly = true)
    public List<ImportReceipt> listImports() { return imports.findAllByOrderByTransactionDateDesc(); }

    @Transactional(readOnly = true)
    public List<Sale> listSales() { return sales.findAllByOrderByTransactionDateDesc(); }

    @Transactional
    public ImportReceipt createImport(ImportRequest request) {
        validateHeader(request == null ? null : request.id(), request == null ? null : request.transactionDate(),
                request == null ? null : request.lines());
        if (imports.existsById(request.id().trim())) conflict("Mã phiếu nhập đã tồn tại");
        Supplier supplier = suppliers.findById(request.supplierId() == null ? "" : request.supplierId())
                .orElseThrow(() -> badRequest("Nhà cung cấp không tồn tại"));
        Employee employee = findEmployee(request.employeeId());
        ImportReceipt receipt = new ImportReceipt();
        receipt.setId(request.id().trim());
        receipt.setSupplier(supplier);
        receipt.setEmployee(employee);
        receipt.setTransactionDate(request.transactionDate());
        Set<String> seen = new HashSet<>();
        for (ImportRequest.Line item : request.lines()) {
            validateLine(item == null ? null : item.batchId(), item == null ? null : item.quantity(), item == null ? null : item.unitPrice());
            if (!seen.add(item.batchId())) throw badRequest("Mỗi lô chỉ được xuất hiện một lần trong phiếu");
            MedicineBatch batch = findBatchForUpdate(item.batchId());
            if (batch.getExpiryDate().isBefore(LocalDate.now())) throw badRequest("Không thể nhập vào lô đã hết hạn: " + batch.getId());
            if (updateStockInApplication) {
                try { batch.setQuantity(Math.addExact(batch.getQuantity(), item.quantity())); }
                catch (ArithmeticException exception) { throw badRequest("Số lượng tồn vượt giới hạn cho lô " + batch.getId()); }
            }
            ImportReceiptLine line = new ImportReceiptLine();
            line.setReceipt(receipt);
            line.setBatch(batch);
            line.setQuantity(item.quantity());
            line.setUnitPrice(item.unitPrice());
            receipt.getLines().add(line);
        }
        return imports.saveAndFlush(receipt);
    }

    @Transactional
    public Sale createSale(SaleRequest request) {
        validateHeader(request == null ? null : request.id(), request == null ? null : request.transactionDate(),
                request == null ? null : request.lines());
        if (sales.existsById(request.id().trim())) conflict("Mã đơn bán đã tồn tại");
        Employee employee = findEmployee(request.employeeId());
        Sale sale = new Sale();
        sale.setId(request.id().trim());
        sale.setEmployee(employee);
        sale.setTransactionDate(request.transactionDate());
        if (request.customerId() != null && !request.customerId().isBlank()) {
            sale.setCustomer(customers.findById(request.customerId().trim())
                    .orElseThrow(() -> badRequest("Khách hàng không tồn tại")));
        }
        Set<String> seen = new HashSet<>();
        for (SaleRequest.Line item : request.lines()) {
            validateLine(item == null ? null : item.batchId(), item == null ? null : item.quantity(), item == null ? null : item.unitPrice());
            if (!seen.add(item.batchId())) throw badRequest("Mỗi lô chỉ được xuất hiện một lần trong đơn bán");
            MedicineBatch batch = findBatchForUpdate(item.batchId());
            if (batch.getExpiryDate().isBefore(LocalDate.now())) throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Không thể bán lô đã hết hạn: " + batch.getId());
            if (batch.getQuantity() < item.quantity()) throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Lô " + batch.getId() + " không đủ tồn kho (còn " + batch.getQuantity() + ")");
            if (updateStockInApplication) batch.setQuantity(batch.getQuantity() - item.quantity());
            SaleLine line = new SaleLine();
            line.setSale(sale);
            line.setBatch(batch);
            line.setQuantity(item.quantity());
            line.setUnitPrice(item.unitPrice());
            sale.getLines().add(line);
        }
        return sales.saveAndFlush(sale);
    }

    private Employee findEmployee(String id) {
        return employees.findById(id == null ? "" : id.trim())
                .orElseThrow(() -> badRequest("Nhân viên không tồn tại"));
    }

    private MedicineBatch findBatchForUpdate(String id) {
        return batches.findByIdForUpdate(id.trim())
                .orElseThrow(() -> badRequest("Lô thuốc " + id + " không tồn tại"));
    }

    private void validateHeader(String id, LocalDate date, List<?> lines) {
        if (id == null || id.isBlank() || id.length() > 50 || date == null || lines == null || lines.isEmpty())
            throw badRequest("Mã, ngày giao dịch và ít nhất một dòng hàng là bắt buộc");
    }

    private void validateLine(String batchId, Integer quantity, Double unitPrice) {
        if (batchId == null || batchId.isBlank() || batchId.length() > 50 || quantity == null || quantity <= 0
                || unitPrice == null || !Double.isFinite(unitPrice) || unitPrice < 0)
            throw badRequest("Lô, số lượng dương và đơn giá hợp lệ là bắt buộc");
    }

    private ResponseStatusException badRequest(String message) { return new ResponseStatusException(HttpStatus.BAD_REQUEST, message); }
    private void conflict(String message) { throw new ResponseStatusException(HttpStatus.CONFLICT, message); }
}
