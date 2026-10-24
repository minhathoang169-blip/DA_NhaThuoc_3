import 'package:flutter/foundation.dart';
import '../models/medicine.dart';
import '../models/cart_item.dart';

class CartManager extends ChangeNotifier {
  static final CartManager _instance = CartManager._internal();
  factory CartManager() => _instance;
  CartManager._internal();

  final List<CartItem> _items = [];

  List<CartItem> get items => List.unmodifiable(_items);

  int get totalItemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get subtotal => _items.fold(0.0, (sum, item) => sum + item.totalPrice);

  bool isInCart(String medicineId) {
    return _items.any((item) => item.medicine.id == medicineId);
  }

  int getQuantity(String medicineId) {
    final found = _items.where((item) => item.medicine.id == medicineId);
    if (found.isEmpty) return 0;
    return found.first.quantity;
  }

  void addToCart(Medicine medicine, {int qty = 1}) {
    final index = _items.indexWhere((item) => item.medicine.id == medicine.id);
    if (index >= 0) {
      _items[index].quantity += qty;
    } else {
      _items.add(CartItem(medicine: medicine, quantity: qty));
    }
    notifyListeners();
  }

  void updateQuantity(String medicineId, int quantity) {
    final index = _items.indexWhere((item) => item.medicine.id == medicineId);
    if (index >= 0) {
      if (quantity <= 0) {
        _items.removeAt(index);
      } else {
        _items[index].quantity = quantity;
      }
      notifyListeners();
    }
  }

  void removeFromCart(String medicineId) {
    _items.removeWhere((item) => item.medicine.id == medicineId);
    notifyListeners();
  }

  void clearCart() {
    _items.clear();
    notifyListeners();
  }

  List<Map<String, dynamic>> toOrderPayload() {
    return _items.map((item) => item.toOrderItemJson()).toList();
  }
}
