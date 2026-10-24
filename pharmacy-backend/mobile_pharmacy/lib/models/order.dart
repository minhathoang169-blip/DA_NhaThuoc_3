class BatchAllocation {
  final String medicineId;
  final String? medicineName;
  final String batchId;
  final int quantity;
  final double unitPrice;
  final String? expiryDate;

  BatchAllocation({
    required this.medicineId,
    this.medicineName,
    required this.batchId,
    required this.quantity,
    required this.unitPrice,
    this.expiryDate,
  });

  factory BatchAllocation.fromJson(Map<String, dynamic> json) {
    return BatchAllocation(
      medicineId: json['medicineId']?.toString() ?? '',
      medicineName: json['medicineName']?.toString(),
      batchId: json['batchId']?.toString() ?? '',
      quantity: (json['quantity'] is num)
          ? (json['quantity'] as num).toInt()
          : (json['allocatedQuantity'] is num)
              ? (json['allocatedQuantity'] as num).toInt()
              : 0,
      unitPrice: (json['unitPrice'] is num)
          ? (json['unitPrice'] as num).toDouble()
          : 0.0,
      expiryDate: json['expiryDate']?.toString(),
    );
  }
}

class OrderDetailItem {
  final String medicineId;
  final String medicineName;
  final int quantity;
  final double unitPrice;
  final String batchId;

  OrderDetailItem({
    required this.medicineId,
    required this.medicineName,
    required this.quantity,
    required this.unitPrice,
    required this.batchId,
  });

  factory OrderDetailItem.fromJson(Map<String, dynamic> json) {
    return OrderDetailItem(
      medicineId: json['medicine'] != null
          ? (json['medicine']['id']?.toString() ?? '')
          : (json['medicineId']?.toString() ?? ''),
      medicineName: json['medicine'] != null
          ? (json['medicine']['name']?.toString() ?? 'Sản phẩm thuốc')
          : (json['medicineName']?.toString() ?? 'Sản phẩm thuốc'),
      quantity: (json['quantity'] is num) ? (json['quantity'] as num).toInt() : 1,
      unitPrice: (json['unitPrice'] is num)
          ? (json['unitPrice'] as num).toDouble()
          : (json['price'] is num)
              ? (json['price'] as num).toDouble()
              : 0.0,
      batchId: json['batch'] != null
          ? (json['batch']['id']?.toString() ?? '')
          : (json['batchId']?.toString() ?? ''),
    );
  }
}

class OrderTrackingResult {
  final dynamic id;
  final String orderNumber;
  final String orderDate;
  final double totalAmount;
  final String status;
  final String shippingAddress;
  final String receiverName;
  final String receiverPhone;
  final List<OrderDetailItem> items;

  OrderTrackingResult({
    required this.id,
    required this.orderNumber,
    required this.orderDate,
    required this.totalAmount,
    required this.status,
    required this.shippingAddress,
    required this.receiverName,
    required this.receiverPhone,
    required this.items,
  });

  factory OrderTrackingResult.fromJson(Map<String, dynamic> json) {
    List<OrderDetailItem> parsedItems = [];
    if (json['orderDetails'] is List) {
      parsedItems = (json['orderDetails'] as List)
          .map((item) => OrderDetailItem.fromJson(item))
          .toList();
    } else if (json['allocations'] is List) {
      parsedItems = (json['allocations'] as List)
          .map((item) => OrderDetailItem(
                medicineId: item['medicineId']?.toString() ?? '',
                medicineName: item['medicineName']?.toString() ?? 'Thuốc',
                quantity: (item['quantity'] ?? item['allocatedQuantity'] ?? 1) as int,
                unitPrice: (item['unitPrice'] is num)
                    ? (item['unitPrice'] as num).toDouble()
                    : 0.0,
                batchId: item['batchId']?.toString() ?? '',
              ))
          .toList();
    }

    return OrderTrackingResult(
      id: json['id'] ?? json['orderId'] ?? 0,
      orderNumber: json['orderNumber']?.toString() ?? '',
      orderDate: json['orderDate']?.toString() ?? '',
      totalAmount: (json['totalAmount'] is num)
          ? (json['totalAmount'] as num).toDouble()
          : 0.0,
      status: json['status']?.toString() ?? 'PENDING',
      shippingAddress: json['shippingAddress']?.toString() ?? '',
      receiverName: json['receiverName']?.toString() ?? '',
      receiverPhone: json['receiverPhone']?.toString() ?? '',
      items: parsedItems,
    );
  }
}
