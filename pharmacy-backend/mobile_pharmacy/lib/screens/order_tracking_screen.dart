import 'package:flutter/material.dart';
import '../services/pharmacy_api_service.dart';
import '../models/order.dart';
import '../theme/app_theme.dart';

class OrderTrackingScreen extends StatefulWidget {
  final String? initialOrderCode;

  const OrderTrackingScreen({super.key, this.initialOrderCode});

  @override
  State<OrderTrackingScreen> createState() => _OrderTrackingScreenState();
}

class _OrderTrackingScreenState extends State<OrderTrackingScreen> {
  late final TextEditingController _codeController;
  OrderTrackingResult? _orderResult;
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _codeController = TextEditingController(text: widget.initialOrderCode ?? '');
    if (widget.initialOrderCode != null && widget.initialOrderCode!.isNotEmpty) {
      _fetchOrder(widget.initialOrderCode!);
    }
  }

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _fetchOrder(String code) async {
    final query = code.trim();
    if (query.isEmpty) return;

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final order = await PharmacyApiService().trackOrder(query);
      if (mounted) {
        setState(() {
          _orderResult = order;
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _errorMessage = e.toString().replaceAll('Exception: ', '');
          _orderResult = null;
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Tra Cứu Tiến Độ Đơn Thuốc'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Search Box Card
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: AppTheme.border),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.02),
                    blurRadius: 10,
                    offset: const Offset(0, 2),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Nhập mã vận đơn / đơn hàng',
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w800, color: AppTheme.textMain),
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _codeController,
                          textCapitalization: TextCapitalization.characters,
                          decoration: InputDecoration(
                            hintText: 'Ví dụ: ORD-20261024-XXXX',
                            prefixIcon: const Icon(Icons.search),
                            suffixIcon: _codeController.text.isNotEmpty
                                ? IconButton(
                                    icon: const Icon(Icons.clear, size: 18),
                                    onPressed: () {
                                      _codeController.clear();
                                      setState(() {});
                                    },
                                  )
                                : null,
                          ),
                          onSubmitted: _fetchOrder,
                        ),
                      ),
                      const SizedBox(width: 10),
                      ElevatedButton(
                        onPressed: _isLoading ? null : () => _fetchOrder(_codeController.text),
                        style: ElevatedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 16),
                        ),
                        child: _isLoading
                            ? const SizedBox(
                                width: 18,
                                height: 18,
                                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                              )
                            : const Text('Tra Cứu'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 20),

            // Lỗi tra cứu
            if (_errorMessage != null)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF2F2),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFFFECACA)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.info_outline, color: AppTheme.error),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Text(
                        _errorMessage!,
                        style: const TextStyle(color: Color(0xFF991B1B), fontSize: 13, fontWeight: FontWeight.w600),
                      ),
                    ),
                  ],
                ),
              ),

            // Kết quả hiển thị chi tiết đơn hàng
            if (_orderResult != null) ...[
              _buildOrderResultCard(_orderResult!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildOrderResultCard(OrderTrackingResult order) {
    final status = order.status.toUpperCase();
    final statusColor = status == 'COMPLETED'
        ? AppTheme.success
        : status == 'CANCELLED'
            ? AppTheme.error
            : AppTheme.primary;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Header Mã Đơn & Trạng Thái
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('MÃ ĐƠN HÀNG', style: TextStyle(fontSize: 11, color: AppTheme.textMuted, fontWeight: FontWeight.bold)),
                      const SizedBox(height: 2),
                      Text(
                        order.orderNumber,
                        style: const TextStyle(fontSize: 16, fontWeight: FontWeight.w900, color: AppTheme.primary),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                    decoration: BoxDecoration(
                      color: statusColor.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(20),
                      border: Border.all(color: statusColor.withOpacity(0.3)),
                    ),
                    child: Text(
                      status,
                      style: TextStyle(
                        fontSize: 12,
                        fontWeight: FontWeight.w900,
                        color: statusColor,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              const Divider(height: 1, color: AppTheme.border),
              const SizedBox(height: 16),

              // Tiến trình đơn hàng (Timeline Stepper)
              _buildStatusTimeline(status),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Thông tin người nhận
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.person_pin_circle_outlined, color: AppTheme.primary, size: 20),
                  SizedBox(width: 8),
                  Text('Thông Tin Nhận Hàng', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                ],
              ),
              const SizedBox(height: 12),
              _itemRow('Người nhận:', order.receiverName),
              const SizedBox(height: 6),
              _itemRow('Số điện thoại:', order.receiverPhone),
              const SizedBox(height: 6),
              _itemRow('Địa chỉ giao:', order.shippingAddress),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // Danh sách thuốc và lô FEFO xuất bán
        Container(
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: AppTheme.border),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Row(
                children: [
                  Icon(Icons.inventory_2_outlined, color: AppTheme.primary, size: 20),
                  SizedBox(width: 8),
                  Text('Thuốc Đã Phân Bổ (FEFO Traceability)', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                ],
              ),
              const SizedBox(height: 12),
              if (order.items.isEmpty)
                const Text('Chưa có thông tin phân bổ lô chi tiết.', style: TextStyle(color: AppTheme.textMuted))
              else
                ...order.items.map(
                  (item) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(10),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(item.medicineName, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
                              if (item.batchId.isNotEmpty)
                                Text('Lô xuất kho: ${item.batchId}', style: const TextStyle(fontSize: 11, color: AppTheme.primary, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                        Text(
                          '${item.quantity} x ${AppTheme.formatVnd(item.unitPrice)}',
                          style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                  ),
                ),
              const Divider(height: 20, color: AppTheme.border),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('Tổng thanh toán:', style: TextStyle(fontSize: 14, fontWeight: FontWeight.bold)),
                  Text(
                    AppTheme.formatVnd(order.totalAmount),
                    style: const TextStyle(fontSize: 18, fontWeight: FontWeight.w900, color: AppTheme.primary),
                  ),
                ],
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildStatusTimeline(String currentStatus) {
    final steps = ['PENDING', 'CONFIRMED', 'SHIPPING', 'COMPLETED'];
    final labels = ['Đã đặt đơn', 'Dược sĩ duyệt', 'Đang giao', 'Giao thành công'];
    int currentIndex = steps.indexOf(currentStatus);
    if (currentIndex == -1) currentIndex = 0;

    return Row(
      children: List.generate(steps.length, (idx) {
        final isPassed = idx <= currentIndex;
        return Expanded(
          child: Column(
            children: [
              Container(
                width: 26,
                height: 26,
                decoration: BoxDecoration(
                  color: isPassed ? AppTheme.primary : const Color(0xFFE2E8F0),
                  shape: BoxShape.circle,
                ),
                child: Center(
                  child: Icon(
                    isPassed ? Icons.check : Icons.circle,
                    size: 14,
                    color: isPassed ? Colors.white : const Color(0xFF94A3B8),
                  ),
                ),
              ),
              const SizedBox(height: 6),
              Text(
                labels[idx],
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontSize: 10,
                  fontWeight: isPassed ? FontWeight.w800 : FontWeight.w500,
                  color: isPassed ? AppTheme.primary : AppTheme.textMuted,
                ),
              ),
            ],
          ),
        );
      }),
    );
  }

  Widget _itemRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SizedBox(
          width: 95,
          child: Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        ),
        Expanded(
          child: Text(
            value,
            style: const TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: AppTheme.textMain),
          ),
        ),
      ],
    );
  }
}
