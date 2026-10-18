package com.nhathuoc.pharmacy_backend.api;

import com.nhathuoc.pharmacy_backend.entity.ImportReceipt;
import com.nhathuoc.pharmacy_backend.entity.Sale;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.List;

@RestController
@RequestMapping("/api")
@Profile({"local", "sqlserver"})
public class InventoryTransactionController {
    private final InventoryTransactionService service;
    public InventoryTransactionController(InventoryTransactionService service) { this.service = service; }

    @GetMapping("/imports")
    @Transactional(readOnly = true)
    public List<TransactionResponse> listImports() { return service.listImports().stream().map(this::toResponse).toList(); }

    @PostMapping("/imports")
    @Transactional
    public ResponseEntity<TransactionResponse> createImport(@RequestBody ImportRequest request) {
        TransactionResponse response = toResponse(service.createImport(request));
        return ResponseEntity.created(URI.create("/api/imports/" + response.id())).body(response);
    }

    @GetMapping("/sales")
    @Transactional(readOnly = true)
    public List<TransactionResponse> listSales() { return service.listSales().stream().map(this::toResponse).toList(); }

    @PostMapping("/sales")
    @Transactional
    public ResponseEntity<TransactionResponse> createSale(@RequestBody SaleRequest request) {
        TransactionResponse response = toResponse(service.createSale(request));
        return ResponseEntity.created(URI.create("/api/sales/" + response.id())).body(response);
    }

    private TransactionResponse toResponse(ImportReceipt receipt) {
        List<TransactionResponse.Line> lines = receipt.getLines().stream().map(line -> new TransactionResponse.Line(
                line.getBatch().getId(), line.getBatch().getMedicine().getName(), line.getQuantity(), line.getUnitPrice(),
                line.getQuantity() * line.getUnitPrice())).toList();
        double total = lines.stream().mapToDouble(TransactionResponse.Line::total).sum();
        return new TransactionResponse(receipt.getId(), receipt.getSupplier().getName(), receipt.getEmployee().getName(),
                receipt.getTransactionDate(), total, lines);
    }

    private TransactionResponse toResponse(Sale sale) {
        List<TransactionResponse.Line> lines = sale.getLines().stream().map(line -> new TransactionResponse.Line(
                line.getBatch().getId(), line.getBatch().getMedicine().getName(), line.getQuantity(), line.getUnitPrice(),
                line.getQuantity() * line.getUnitPrice())).toList();
        double total = lines.stream().mapToDouble(TransactionResponse.Line::total).sum();
        String customerName = sale.getCustomer() == null ? "Khách lẻ" : sale.getCustomer().getName();
        return new TransactionResponse(sale.getId(), customerName, sale.getEmployee().getName(),
                sale.getTransactionDate(), total, lines);
    }
}
