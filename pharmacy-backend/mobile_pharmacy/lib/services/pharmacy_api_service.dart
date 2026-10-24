import 'dart:convert';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/medicine.dart';
import '../models/order.dart';

class PharmacyApiService {
  static final PharmacyApiService _instance = PharmacyApiService._internal();
  factory PharmacyApiService() => _instance;
  PharmacyApiService._internal();

  /// 1. Tìm kiếm và lấy danh mục thuốc từ CSDL thật
  Future<List<Medicine>> getMedicines({String query = ''}) async {
    final uri = Uri.parse(
      query.trim().isEmpty
          ? ApiConfig.searchMedicines
          : '${ApiConfig.searchMedicines}?q=${Uri.encodeComponent(query.trim())}',
    );

    try {
      final response = await http.get(uri).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
        return data.map((json) => Medicine.fromJson(json)).toList();
      } else {
        throw Exception('Mã phản hồi từ máy chủ: ${response.statusCode}');
      }
    } catch (e) {
      // Fallback sang endpoint danh mục cũ /api/medicines nếu v1 lỗi
      try {
        final fallbackUri = Uri.parse('${ApiConfig.baseUrl}/medicines');
        final fallbackRes = await http.get(fallbackUri).timeout(const Duration(seconds: 5));
        if (fallbackRes.statusCode == 200) {
          final List<dynamic> data = jsonDecode(utf8.decode(fallbackRes.bodyBytes));
          return data.map((json) => Medicine.fromJson(json)).toList();
        }
      } catch (_) {}
      rethrow;
    }
  }

  /// 2. Lấy gợi ý thuốc thay thế cùng hoạt chất khi hết hàng
  Future<List<Medicine>> getSubstitutes(String medicineId) async {
    final uri = Uri.parse(ApiConfig.medicineSubstitutes(medicineId));

    try {
      final response = await http.get(uri).timeout(const Duration(seconds: 8));

      if (response.statusCode == 200) {
        final List<dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
        return data.map((json) => Medicine.fromJson(json)).toList();
      } else {
        return [];
      }
    } catch (e) {
      return [];
    }
  }

  /// 3. Gửi đơn đặt hàng thuốc Online (Tự động trừ kho theo thuật toán FEFO)
  Future<OrderTrackingResult> checkoutOnline({
    required String receiverName,
    required String receiverPhone,
    required String shippingAddress,
    required List<Map<String, dynamic>> items,
  }) async {
    final uri = Uri.parse(ApiConfig.onlineCheckout);

    final payload = {
      'receiverName': receiverName.trim(),
      'receiverPhone': receiverPhone.trim(),
      'shippingAddress': shippingAddress.trim(),
      'items': items,
    };

    final response = await http.post(
      uri,
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'Accept': 'application/json',
      },
      body: jsonEncode(payload),
    ).timeout(const Duration(seconds: 12));

    if (response.statusCode == 200 || response.statusCode == 201) {
      final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
      return OrderTrackingResult.fromJson(data);
    } else {
      String errorMessage = 'Đặt hàng không thành công (HTTP ${response.statusCode})';
      try {
        final Map<String, dynamic> errJson = jsonDecode(utf8.decode(response.bodyBytes));
        if (errJson.containsKey('message')) {
          errorMessage = errJson['message'];
        }
      } catch (_) {}
      throw Exception(errorMessage);
    }
  }

  /// 4. Tra cứu hành trình đơn hàng theo mã (VD: ORD-20261024-XXXX)
  Future<OrderTrackingResult> trackOrder(String orderCode) async {
    final uri = Uri.parse(ApiConfig.trackOrder(orderCode.trim()));

    final response = await http.get(uri).timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
      return OrderTrackingResult.fromJson(data);
    } else if (response.statusCode == 404) {
      throw Exception('Không tìm thấy đơn hàng có mã "$orderCode".');
    } else {
      throw Exception('Không thể tra cứu đơn hàng (HTTP ${response.statusCode})');
    }
  }
}
