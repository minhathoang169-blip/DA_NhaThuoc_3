class Medicine {
  final String id;
  final String name;
  final String category;
  final double price;
  final String barcode;
  final String? activeIngredientName;
  final int totalStock;
  final String? nearestExpiryDate;

  Medicine({
    required this.id,
    required this.name,
    required this.category,
    required this.price,
    required this.barcode,
    this.activeIngredientName,
    required this.totalStock,
    this.nearestExpiryDate,
  });

  factory Medicine.fromJson(Map<String, dynamic> json) {
    return Medicine(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? 'Thuốc chưa đặt tên',
      category: json['category']?.toString() ?? 'Thuốc không kê đơn',
      price: (json['price'] is num) ? (json['price'] as num).toDouble() : 0.0,
      barcode: json['barcode']?.toString() ?? '',
      activeIngredientName: json['activeIngredientName']?.toString() ??
          json['activeIngredient']?.toString(),
      totalStock: (json['totalStock'] is num)
          ? (json['totalStock'] as num).toInt()
          : (json['stock'] is num)
              ? (json['stock'] as num).toInt()
              : 0,
      nearestExpiryDate: json['nearestExpiryDate']?.toString() ??
          json['nearestExpiry']?.toString(),
    );
  }

  bool get isAvailable => totalStock > 0;
  bool get isPrescriptionRequired =>
      category.toLowerCase().contains('kháng sinh') ||
      category.toLowerCase().contains('kê đơn') ||
      category.toLowerCase().contains('tim mạch');
}
