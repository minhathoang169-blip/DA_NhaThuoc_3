import 'package:flutter/material.dart';
import '../models/medicine.dart';
import '../theme/app_theme.dart';
import '../services/cart_manager.dart';
import '../services/pharmacy_api_service.dart';

class MedicineDetailScreen extends StatefulWidget {
  final Medicine medicine;

  const MedicineDetailScreen({super.key, required this.medicine});

  @override
  State<MedicineDetailScreen> createState() => _MedicineDetailScreenState();
}

class _MedicineDetailScreenState extends State<MedicineDetailScreen> {
  int _quantity = 1;
  List<Medicine> _substitutes = [];
  bool _loadingSubstitutes = false;

  @override
  void initState() {
    super.initState();
    if (!widget.medicine.isAvailable) {
      _fetchSubstitutes();
    }
  }

  Future<void> _fetchSubstitutes() async {
    setState(() => _loadingSubstitutes = true);
    try {
      final list = await PharmacyApiService().getSubstitutes(widget.medicine.id);
      if (mounted) {
        setState(() {
          _substitutes = list;
          _loadingSubstitutes = false;
        });
      }
    } catch (_) {
      if (mounted) setState(() => _loadingSubstitutes = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final med = widget.medicine;
    final isRx = med.isPrescriptionRequired;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Chi Tiết Sản Phẩm'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Product Banner & Icon
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(vertical: 36, horizontal: 20),
              decoration: const BoxDecoration(
                gradient: LinearGradient(
                  colors: [Color(0xFFE6FFFA), Color(0xFFF0FDF4)],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
              ),
              child: Center(
                child: Container(
                  width: 90,
                  height: 90,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.06),
                        blurRadius: 16,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Center(
                    child: Text('💊', style: TextStyle(fontSize: 44)),
                  ),
                ),
              ),
            ),

            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Badges
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(
                          color: isRx ? const Color(0xFFFEF2F2) : const Color(0xFFECFDF5),
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: isRx ? const Color(0xFFFECACA) : const Color(0xFFA7F3D0),
                          ),
                        ),
                        child: Text(
                          isRx ? 'Toa Bác Sĩ (Rx)' : 'Thuốc Không Kê Đơn (OTC)',
                          style: TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w800,
                            color: isRx ? AppTheme.error : AppTheme.success,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                        decoration: BoxDecoration(
                          color: const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          med.category,
                          style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w600,
                            color: Color(0xFF475569),
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),

                  // Name
                  Text(
                    med.name,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.w900,
                      color: AppTheme.textMain,
                      letterSpacing: -0.5,
                    ),
                  ),
                  const SizedBox(height: 10),

                  // Price
                  Row(
                    crossAxisAlignment: CrossAxisAlignment.baseline,
                    textBaseline: TextBaseline.alphabetic,
                    children: [
                      Text(
                        AppTheme.formatVnd(med.price),
                        style: const TextStyle(
                          fontSize: 26,
                          fontWeight: FontWeight.w900,
                          color: AppTheme.primary,
                        ),
                      ),
                      const SizedBox(width: 8),
                      const Text(
                        '/ Hộp (Đã gồm VAT)',
                        style: TextStyle(
                          fontSize: 13,
                          color: AppTheme.textMuted,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),

                  // Thông tin tiêu chuẩn GPP Card
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: Column(
                      children: [
                        _infoRow(
                          'Hoạt chất chỉ định',
                          med.activeIngredientName ?? 'Theo Dược thư chuẩn',
                          isBold: true,
                        ),
                        const Divider(height: 18, color: AppTheme.border),
                        _infoRow('Mã vạch / Barcode', med.barcode.isNotEmpty ? med.barcode : '893600000000'),
                        const Divider(height: 18, color: AppTheme.border),
                        _infoRow('Tình trạng tồn kho', med.isAvailable ? 'Còn ${med.totalStock} hộp khả dụng' : 'Tạm hết hàng'),
                        if (med.nearestExpiryDate != null) ...[
                          const Divider(height: 18, color: AppTheme.border),
                          _infoRow('Hạn dùng gần nhất', med.nearestExpiryDate!),
                        ],
                      ],
                    ),
                  ),
                  const SizedBox(height: 24),

                  // Gợi ý thuốc cùng hoạt chất nếu hết hàng
                  if (!med.isAvailable) ...[
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                        color: const Color(0xFFFEF3C7),
                        borderRadius: BorderRadius.circular(14),
                        border: Border.all(color: const Color(0xFFFDE68A)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Row(
                            children: [
                              Text('💡', style: TextStyle(fontSize: 18)),
                              SizedBox(width: 8),
                              Expanded(
                                child: Text(
                                  'Gợi ý thuốc thay thế cùng hoạt chất',
                                  style: TextStyle(
                                    fontSize: 14,
                                    fontWeight: FontWeight.w800,
                                    color: Color(0xFF92400E),
                                  ),
                                ),
                              ),
                            ],
                          ),
                          const SizedBox(height: 6),
                          Text(
                            'Sản phẩm "${med.name}" tạm hết hàng. Bạn có thể tham khảo các biệt dược khác cùng hoạt chất (${med.activeIngredientName ?? ""}):',
                            style: const TextStyle(fontSize: 12.5, color: Color(0xFFB45309)),
                          ),
                          const SizedBox(height: 12),
                          if (_loadingSubstitutes)
                            const Center(
                              child: Padding(
                                padding: EdgeInsets.all(12),
                                child: CircularProgressIndicator(),
                              ),
                            )
                          else if (_substitutes.isEmpty)
                            const Text(
                              'Chưa tìm thấy thuốc cùng hoạt chất khác còn tồn trong kho.',
                              style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic, color: Color(0xFF92400E)),
                            )
                          else
                            ..._substitutes.map(
                              (sub) => Container(
                                margin: const EdgeInsets.only(bottom: 8),
                                padding: const EdgeInsets.all(10),
                                decoration: BoxDecoration(
                                  color: Colors.white,
                                  borderRadius: BorderRadius.circular(10),
                                ),
                                child: Row(
                                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                  children: [
                                    Expanded(
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            sub.name,
                                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                                          ),
                                          Text(
                                            'Giá: ${AppTheme.formatVnd(sub.price)} | Tồn: ${sub.totalStock}',
                                            style: const TextStyle(fontSize: 11, color: AppTheme.textMuted),
                                          ),
                                        ],
                                      ),
                                    ),
                                    ElevatedButton(
                                      onPressed: () {
                                        CartManager().addToCart(sub, qty: 1);
                                        ScaffoldMessenger.of(context).showSnackBar(
                                          SnackBar(
                                            content: Text('Đã chọn thuốc thay thế: ${sub.name}'),
                                            backgroundColor: AppTheme.primary,
                                          ),
                                        );
                                      },
                                      style: ElevatedButton.styleFrom(
                                        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                      ),
                                      child: const Text('Chọn', style: TextStyle(fontSize: 12)),
                                    ),
                                  ],
                                ),
                              ),
                            ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 20),
                  ],

                  // Cam kết chất lượng
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF8FAFC),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: AppTheme.border),
                    ),
                    child: const Row(
                      children: [
                        Icon(Icons.verified_outlined, color: AppTheme.primary, size: 28),
                        SizedBox(width: 12),
                        Expanded(
                          child: Text(
                            'Cam kết 100% thuốc chính hãng, nguồn gốc rõ ràng, bảo quản tiêu chuẩn GPP chuẩn Bộ Y Tế.',
                            style: TextStyle(fontSize: 12, color: Color(0xFF475569)),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
      bottomNavigationBar: med.isAvailable
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              decoration: BoxDecoration(
                color: Colors.white,
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.05),
                    blurRadius: 10,
                    offset: const Offset(0, -3),
                  ),
                ],
              ),
              child: SafeArea(
                child: Row(
                  children: [
                    // Quantity Stepper
                    Container(
                      decoration: BoxDecoration(
                        border: Border.all(color: AppTheme.border),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Row(
                        children: [
                          IconButton(
                            icon: const Icon(Icons.remove, size: 18),
                            onPressed: _quantity > 1
                                ? () => setState(() => _quantity--)
                                : null,
                          ),
                          Text(
                            '$_quantity',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 16),
                          ),
                          IconButton(
                            icon: const Icon(Icons.add, size: 18),
                            onPressed: _quantity < med.totalStock
                                ? () => setState(() => _quantity++)
                                : null,
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(width: 14),

                    // Add to cart CTA
                    Expanded(
                      child: ElevatedButton.icon(
                        icon: const Icon(Icons.shopping_bag_outlined),
                        label: Text('Thêm vào giỏ (${AppTheme.formatVnd(med.price * _quantity)})'),
                        onPressed: () {
                          CartManager().addToCart(med, qty: _quantity);
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('Đã thêm $_quantity hộp "${med.name}" vào giỏ'),
                              backgroundColor: AppTheme.primaryDark,
                            ),
                          );
                          Navigator.of(context).pop();
                        },
                      ),
                    ),
                  ],
                ),
              ),
            )
          : null,
    );
  }

  Widget _infoRow(String label, String value, {bool isBold = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(label, style: const TextStyle(fontSize: 13, color: AppTheme.textMuted)),
        Text(
          value,
          style: TextStyle(
            fontSize: 13,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            color: AppTheme.textMain,
          ),
        ),
      ],
    );
  }
}
