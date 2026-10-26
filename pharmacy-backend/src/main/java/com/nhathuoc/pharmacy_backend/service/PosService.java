package com.nhathuoc.pharmacy_backend.service;

import com.nhathuoc.pharmacy_backend.dto.*;
import com.nhathuoc.pharmacy_backend.entity.*;
import com.nhathuoc.pharmacy_backend.exception.InsufficientStockException;
import com.nhathuoc.pharmacy_backend.exception.ResourceNotFoundException;
import com.nhathuoc.pharmacy_backend.repository.*;
import com.nhathuoc.pharmacy_backend.security.CustomUserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class PosService {

    private final MedicineRepository medicineRepository;
    private final MedicineBatchRepository batchRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceDetailRepository invoiceDetailRepository;
    private final OnlineOrderRepository onlineOrderRepository;
    private final UserRepository userRepository;

    public PosService(MedicineRepository medicineRepository,
                      MedicineBatchRepository batchRepository,
                      InvoiceRepository invoiceRepository,
                      InvoiceDetailRepository invoiceDetailRepository,
                      OnlineOrderRepository onlineOrderRepository,
                      UserRepository userRepository) {
        this.medicineRepository = medicineRepository;
        this.batchRepository = batchRepository;
        this.invoiceRepository = invoiceRepository;
        this.invoiceDetailRepository = invoiceDetailRepository;
        this.onlineOrderRepository = onlineOrderRepository;
        this.userRepository = userRepository;
    }

    /**
     * Nghiệp vụ thanh toán tại quầy POS:
     * - Áp dụng @Transactional với mức cô lập Isolation.READ_COMMITTED kết hợp Pessimistic Write Lock
     *   trên tầng Repository để chống bán âm kho (Race Condition).
     * - Áp dụng thuật toán FEFO (First Expired, First Out):
     *     + Chỉ chọn các lô còn hạn (expiryDate >= today) và tồn kho > 0.
     *     + Sắp xếp ngày hết hạn tăng dần (gần nhất xuất trước).
     *     + Tự động chia tách số lượng cần mua trải dài qua nhiều lô nếu lô trước đó không đủ.
     *     + Bỏ qua hoàn toàn các lô đã hết hạn (dù còn tồn kho).
     * - Lưu chi tiết hóa đơn (InvoiceDetail) gắn trực tiếp với từng Batch ID để phục vụ truy vết lô thuốc.
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public PosCheckoutResponse checkout(PosCheckoutRequest request, CustomUserDetails pharmacistUser) {
        LocalDate today = LocalDate.now();
        List<BatchAllocationDto> allocations = new ArrayList<>();
        List<InvoiceDetail> detailsToSave = new ArrayList<>();

        double subtotal = 0.0;

        Invoice invoice = new Invoice();
        String invoiceNumber = "HD-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        invoice.setInvoiceNumber(invoiceNumber);
        invoice.setSaleDate(LocalDateTime.now());
        invoice.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "CASH");
        invoice.setCustomerName(request.getCustomerName() != null ? request.getCustomerName() : "Khách vãng lai");
        invoice.setCustomerPhone(request.getCustomerPhone());

        if (pharmacistUser != null) {
            User pharmacist = userRepository.findById(pharmacistUser.getId()).orElse(null);
            invoice.setPharmacist(pharmacist);
        }

        // Duyệt từng sản phẩm trong giỏ hàng và trừ kho FEFO
        for (OrderItemRequest item : request.getItems()) {
            Medicine medicine = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thuốc có mã: " + item.getMedicineId()));

            int neededQuantity = item.getQuantity();

            // Khóa dòng các lô thuốc còn hạn của sản phẩm này để xử lý đồng thời an toàn
            List<MedicineBatch> availableBatches = batchRepository.findAvailableBatchesForSaleWithLock(medicine.getId(), today);

            int totalAvailableInBatches = availableBatches.stream().mapToInt(MedicineBatch::getQuantity).sum();
            if (totalAvailableInBatches < neededQuantity) {
                throw new InsufficientStockException(
                        String.format("Thuốc '%s' (Mã: %s) không đủ số lượng tồn kho khả dụng để xuất bán! " +
                                      "(Yêu cầu: %d, Khả dụng còn hạn: %d)",
                                medicine.getName(), medicine.getId(), neededQuantity, totalAvailableInBatches)
                );
            }

            int remainingNeeded = neededQuantity;

            // Phân bổ trừ kho theo từng lô (FEFO)
            for (MedicineBatch batch : availableBatches) {
                if (remainingNeeded <= 0) {
                    break;
                }

                int deductQuantity = Math.min(batch.getQuantity(), remainingNeeded);
                batch.setQuantity(batch.getQuantity() - deductQuantity);
                batchRepository.save(batch);

                double itemPrice = medicine.getPrice();
                double lineTotal = deductQuantity * itemPrice;
                subtotal += lineTotal;

                // Ghi nhận chi tiết phân bổ cho từng lô
                BatchAllocationDto allocation = new BatchAllocationDto(
                        medicine.getId(),
                        medicine.getName(),
                        batch.getId(),
                        batch.getBatchNumber(),
                        batch.getExpiryDate(),
                        deductQuantity,
                        itemPrice,
                        lineTotal
                );
                allocations.add(allocation);

                // Tạo InvoiceDetail gắn với Lô để phục vụ truy vết
                InvoiceDetail detail = new InvoiceDetail();
                detail.setInvoice(invoice);
                detail.setMedicine(medicine);
                detail.setBatch(batch);
                detail.setQuantity(deductQuantity);
                detail.setUnitPrice(itemPrice);
                detail.setTotalPrice(lineTotal);
                detailsToSave.add(detail);

                remainingNeeded -= deductQuantity;
            }
        }

        double discount = Math.max(0, request.getDiscountAmount());
        double totalAmount = Math.max(0, subtotal - discount);
        double customerPaid = request.getCustomerPaid();
        if (customerPaid <= 0 && "CASH".equalsIgnoreCase(request.getPaymentMethod())) {
            customerPaid = totalAmount; // Nếu không nhập tiền khách đưa, mặc định là khách đưa đủ
        }
        double changeAmount = Math.max(0, customerPaid - totalAmount);

        invoice.setSubtotal(subtotal);
        invoice.setDiscountAmount(discount);
        invoice.setTotalAmount(totalAmount);
        invoice.setCustomerPaid(customerPaid);
        invoice.setChangeAmount(changeAmount);

        Invoice savedInvoice = invoiceRepository.save(invoice);

        for (InvoiceDetail detail : detailsToSave) {
            detail.setInvoice(savedInvoice);
        }
        List<InvoiceDetail> savedDetails = invoiceDetailRepository.saveAll(detailsToSave);
        savedInvoice.setInvoiceDetails(savedDetails);

        List<InvoiceDetailResponse> detailResponses = savedDetails.stream()
                .map(d -> new InvoiceDetailResponse(
                        d.getId(),
                        d.getMedicine().getId(),
                        d.getMedicine().getName(),
                        d.getBatch().getId(),
                        d.getQuantity(),
                        d.getUnitPrice(),
                        d.getTotalPrice()
                ))
                .toList();

        return new PosCheckoutResponse(
                savedInvoice.getId(),
                savedInvoice.getInvoiceNumber(),
                savedInvoice.getSaleDate(),
                savedInvoice.getSubtotal(),
                savedInvoice.getDiscountAmount(),
                savedInvoice.getTotalAmount(),
                savedInvoice.getCustomerPaid(),
                savedInvoice.getChangeAmount(),
                savedInvoice.getPaymentMethod(),
                pharmacistUser != null ? pharmacistUser.getUsername() : null,
                pharmacistUser != null ? pharmacistUser.getFullName() : null,
                savedInvoice.getCustomerName(),
                savedInvoice.getCustomerPhone(),
                detailResponses,
                allocations
        );
    }

    /**
     * Nghiệp vụ thanh toán đơn hàng Online (FEFO Deduction tương tự)
     */
    @Transactional(isolation = Isolation.READ_COMMITTED)
    public OnlineCheckoutResponse onlineCheckout(OnlineCheckoutRequest request, CustomUserDetails customerUser) {
        LocalDate today = LocalDate.now();
        List<BatchAllocationDto> allocations = new ArrayList<>();
        List<OrderDetail> detailsToSave = new ArrayList<>();
        double totalAmount = 0.0;

        OnlineOrder order = new OnlineOrder();
        String orderNumber = "ONL-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd-HHmmss"))
                + "-" + UUID.randomUUID().toString().substring(0, 4).toUpperCase();
        order.setOrderNumber(orderNumber);
        order.setOrderDate(LocalDateTime.now());
        order.setShippingAddress(request.getShippingAddress());
        order.setReceiverName(request.getReceiverName());
        order.setReceiverPhone(request.getReceiverPhone());
        order.setStatus("PENDING");

        if (customerUser != null) {
            User customer = userRepository.findById(customerUser.getId()).orElse(null);
            order.setCustomer(customer);
        }

        for (OrderItemRequest item : request.getItems()) {
            Medicine medicine = medicineRepository.findById(item.getMedicineId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thuốc có mã: " + item.getMedicineId()));

            int neededQuantity = item.getQuantity();

            List<MedicineBatch> availableBatches = batchRepository.findAvailableBatchesForSaleWithLock(medicine.getId(), today);
            int totalAvailable = availableBatches.stream().mapToInt(MedicineBatch::getQuantity).sum();
            if (totalAvailable < neededQuantity) {
                throw new InsufficientStockException(
                        String.format("Sản phẩm '%s' không đủ số lượng tồn kho khả dụng để đặt hàng online! (Cần: %d, Còn: %d)",
                                medicine.getName(), neededQuantity, totalAvailable)
                );
            }

            int remainingNeeded = neededQuantity;
            for (MedicineBatch batch : availableBatches) {
                if (remainingNeeded <= 0) break;

                int deduct = Math.min(batch.getQuantity(), remainingNeeded);
                batch.setQuantity(batch.getQuantity() - deduct);
                batchRepository.save(batch);

                double lineTotal = deduct * medicine.getPrice();
                totalAmount += lineTotal;

                allocations.add(new BatchAllocationDto(
                        medicine.getId(),
                        medicine.getName(),
                        batch.getId(),
                        batch.getBatchNumber(),
                        batch.getExpiryDate(),
                        deduct,
                        medicine.getPrice(),
                        lineTotal
                ));

                OrderDetail detail = new OrderDetail();
                detail.setOnlineOrder(order);
                detail.setMedicine(medicine);
                detail.setBatch(batch);
                detail.setQuantity(deduct);
                detail.setPrice(medicine.getPrice());
                detail.setTotalPrice(lineTotal);
                detailsToSave.add(detail);

                remainingNeeded -= deduct;
            }
        }

        order.setTotalAmount(totalAmount);
        order.setOrderDetails(detailsToSave);
        OnlineOrder savedOrder = onlineOrderRepository.save(order);

        return new OnlineCheckoutResponse(
                savedOrder.getId(),
                savedOrder.getOrderNumber(),
                savedOrder.getOrderDate(),
                savedOrder.getTotalAmount(),
                savedOrder.getStatus(),
                savedOrder.getShippingAddress(),
                savedOrder.getReceiverName(),
                savedOrder.getReceiverPhone(),
                allocations
        );
    }

    @Transactional(readOnly = true)
    public List<OnlineOrder> getAllOrders() {
        return onlineOrderRepository.findAllByOrderByOrderDateDesc();
    }

    @Transactional(readOnly = true)
    public OnlineOrder getOrderByNumber(String orderNumber) {
        return onlineOrderRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng với mã: " + orderNumber));
    }

    @Transactional
    public OnlineOrder updateOrderStatus(Long orderId, String newStatus) {
        OnlineOrder order = onlineOrderRepository.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy đơn hàng ID: " + orderId));
        order.setStatus(newStatus.toUpperCase().trim());
        return onlineOrderRepository.save(order);
    }
}

