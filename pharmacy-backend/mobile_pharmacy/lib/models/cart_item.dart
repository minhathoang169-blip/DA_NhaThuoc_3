import 'medicine.dart';

class CartItem {
  final Medicine medicine;
  int quantity;

  CartItem({
    required this.medicine,
    this.quantity = 1,
  });

  double get totalPrice => medicine.price * quantity;

  Map<String, dynamic> toOrderItemJson() {
    return {
      'medicineId': medicine.id,
      'quantity': quantity,
    };
  }
}
