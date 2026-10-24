import 'package:flutter/material.dart';
import '../services/cart_manager.dart';
import '../services/pharmacy_api_service.dart';
import '../theme/app_theme.dart';
import '../models/order.dart';
import 'order_tracking_screen.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();
  final _nameController = TextEditingController(text: 'Trần Văn Hoàng');
  final _phoneController = TextEditingController(text: '0905123456');
  final _addressController = TextEditingController(text: 'Số 45 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM');

  String _paymentMethod = 'COD';
  bool _isSubmitting = false;

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    super.dispose();
  }

  Future<void> _handleCheckout() async {
    if (!_formKey.currentState!.validate()) return;

    final cart = CartManager();
    if (cart.items.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Giỏ hàng rỗng, không thể đặt hàng')),
      );
      return;
    }

    setState(() => _isSubmitting = true);

    try {
      final result = await PharmacyApiService().checkoutOnline(
        receiverName: _nameController.text.trim(),
        receiverPhone: _phoneController.text.trim(),
        shippingAddress: _addressController.text.trim(),
        items: cart.toOrderPayload(),
      );

      // Đặt hàng thành công -> Xóa giỏ hàng
      cart.clearCart();

      if (!mounted) return;
      setState(() => _isSubmitting = false);

      // Hiển thị Popup xác nhận và chuyển sang tra cứu
      _showSuccessDialog(result);
    } catch (e) {
      if (!mounted) return;
      setState(() => _isSubmitting = false);

      showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
          title: const Row(
            children: [
              Icon(Icons.error_outline, color: AppTheme.error),
              SizedBox(width: 8),
              Text('Đặt hàng thất bại'),
            ],
          ),
          content: Text('$e'),
          actions: [
            ElevatedButton(
              onPressed: () => Navigator.of(ctx).pop(),
              child: const Text('Đóng'),
            ),
          ],
        ),
      );
    }
  }

  void _showSuccessDialog(OrderTrackingResult order) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
        title: Column(
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: const BoxDecoration(
                color: Color(0xFFDCFCE7),
                shape: BoxShape.circle,
              ),
              child: const Center(
                child: Icon(Icons.check_circle, color: AppTheme.success, size: 38),
              ),
            ),
            const SizedBox(height: 12),
            const Text(
              'ĐẶT HÀNG THÀNH CÔNG!',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w900,
                color: AppTheme.textMain,
              ),
            ),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFFF0FDF4),
                borderRadius: BorderRadius.circular(10),
                border: Border.all(color: const Color(0xFFBBF7D0)),
              ),
              child: Row(
                children: [
                  const Text('Mã đơn hàng: ', style: TextStyle(fontSize: 13)),
                  Expanded(
                    child: Text(
                      order.orderNumber,
                      style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w900,
                        color: AppTheme.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Đơn hàng đã được lưu và kho Dược đã tự động phân bổ lô theo thuật toán FEFO. Dược sĩ sẽ kiểm tra và xuất đơn sớm nhất.',
              style: TextStyle(fontSize: 12.5, color: Colors.grey.shade700, height: 1.4),
            ),
          ],
        ),
        actions: [
          OutlinedButton(
            onPressed: () {
              Navigator.of(ctx).pop(); // đóng dialog
              Navigator.of(context).popUntil((route) => route.isFirst); // về Home
            },
            child: const Text('Về Trang Chủ'),
          ),
          ElevatedButton(
            onPressed: () {
              Navigator.of(ctx).pop();
              Navigator.of(context).pushReplacement(
                MaterialPageRoute(
                  builder: (_) => OrderTrackingScreen(initialOrderCode: order.orderNumber),
                ),
              );
            },
            child: const Text('Xem Tiến Độ Đơn'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = CartManager();
    final shippingFee = cart.subtotal >= 300000 ? 0.0 : 25000.0;
    final grandTotal = cart.subtotal + shippingFee;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Thông Tin Nhận Thuốc'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Thông tin nhận hàng Card
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
                        Icon(Icons.location_on_outlined, color: AppTheme.primary, size: 22),
                        SizedBox(width: 8),
                        Text(
                          'Địa Chỉ Giao Hàng',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: _nameController,
                      decoration: const InputDecoration(
                        labelText: 'Họ tên người nhận *',
                        prefixIcon: Icon(Icons.person_outline),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Vui lòng nhập họ tên' : null,
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _phoneController,
                      keyboardType: TextInputType.phone,
                      decoration: const InputDecoration(
                        labelText: 'Số điện thoại nhận thuốc *',
                        prefixIcon: Icon(Icons.phone_outlined),
                      ),
                      validator: (val) {
                        if (val == null || val.trim().isEmpty) return 'Vui lòng nhập số điện thoại';
                        if (val.trim().length < 9) return 'Số điện thoại không hợp lệ';
                        return null;
                      },
                    ),
                    const SizedBox(height: 14),
                    TextFormField(
                      controller: _addressController,
                      maxLines: 2,
                      decoration: const InputDecoration(
                        labelText: 'Địa chỉ nhận hàng chi tiết *',
                        prefixIcon: Icon(Icons.home_outlined),
                      ),
                      validator: (val) => val == null || val.trim().isEmpty ? 'Vui lòng nhập địa chỉ nhận hàng' : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Hình thức thanh toán Card
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
                        Icon(Icons.payment_outlined, color: AppTheme.primary, size: 22),
                        SizedBox(width: 8),
                        Text(
                          'Hình Thức Thanh Toán',
                          style: TextStyle(fontSize: 16, fontWeight: FontWeight.w800),
                        ),
                      ],
                    ),
                    const SizedBox(height: 14),
                    RadioListTile<String>(
                      value: 'COD',
                      groupValue: _paymentMethod,
                      onChanged: (val) => setState(() => _paymentMethod = val!),
                      title: const Text('Thanh toán khi nhận thuốc (COD)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
                      subtitle: const Text('Kiểm tra thuốc và hóa đơn trước khi trả tiền cho bưu tá', style: TextStyle(fontSize: 11.5)),
                      activeColor: AppTheme.primary,
                      contentPadding: EdgeInsets.zero,
                    ),
                    const Divider(height: 1, color: AppTheme.border),
                    RadioListTile<String>(
                      value: 'VIETQR',
                      groupValue: _paymentMethod,
                      onChanged: (val) => setState(() => _paymentMethod = val!),
                      title: const Text('Chuyển khoản VietQR Pro', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13.5)),
                      subtitle: const Text('Quét mã QR tự động xác nhận giao dịch qua Ngân hàng', style: TextStyle(fontSize: 11.5)),
                      activeColor: AppTheme.primary,
                      contentPadding: EdgeInsets.zero,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 20),

              // Chi tiết thanh toán Summary Card
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
                    const Text('Chi Tiết Đơn Hàng', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w800)),
                    const SizedBox(height: 12),
                    _summaryRow('Tiền hàng (${cart.totalItemCount} sản phẩm):', AppTheme.formatVnd(cart.subtotal)),
                    const SizedBox(height: 8),
                    _summaryRow(
                      'Phí giao hàng:',
                      shippingFee == 0 ? 'MIỄN PHÍ' : AppTheme.formatVnd(shippingFee),
                      color: shippingFee == 0 ? AppTheme.success : null,
                    ),
                    const Divider(height: 20, color: AppTheme.border),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'Tổng tiền thanh toán:',
                          style: TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                        ),
                        Text(
                          AppTheme.formatVnd(grandTotal),
                          style: const TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.w900,
                            color: AppTheme.primary,
                          ),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Nút hoàn tất đặt hàng
              SizedBox(
                width: double.infinity,
                height: 52,
                child: ElevatedButton(
                  onPressed: _isSubmitting ? null : _handleCheckout,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppTheme.primaryDark,
                  ),
                  child: _isSubmitting
                      ? const Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2),
                            ),
                            SizedBox(width: 12),
                            Text('Đang xử lý trừ kho FEFO...'),
                          ],
                        )
                      : Text(
                          'Xác Nhận Đặt Thuốc (${AppTheme.formatVnd(grandTotal)})',
                          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w900),
                        ),
                ),
              ),
              const SizedBox(height: 14),
              const Center(
                child: Text(
                  '🔒 Dữ liệu được mã hóa & bảo mật chuẩn Dược quốc gia',
                  style: TextStyle(fontSize: 11.5, color: AppTheme.textMuted),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _summaryRow(String label, String value, {Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w700,
            color: color ?? AppTheme.textMain,
          ),
        ),
      ],
    );
  }
}
