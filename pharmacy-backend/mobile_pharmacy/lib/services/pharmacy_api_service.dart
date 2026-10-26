import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;
import '../config/api_config.dart';
import '../models/medicine.dart';
import '../models/order.dart';

class MobileUserSession {
  final int id;
  final String username;
  final String fullName;
  final String role;
  final String token;

  MobileUserSession({
    required this.id,
    required this.username,
    required this.fullName,
    required this.role,
    required this.token,
  });

  factory MobileUserSession.fromJson(Map<String, dynamic> json) {
    return MobileUserSession(
      id: (json['id'] is num) ? (json['id'] as num).toInt() : 0,
      username: json['username']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? json['username']?.toString() ?? 'Khách hàng',
      role: json['role']?.toString() ?? 'CUSTOMER',
      token: json['token']?.toString() ?? '',
    );
  }
}

class PharmacyApiService extends ChangeNotifier {
  static final PharmacyApiService _instance = PharmacyApiService._internal();
  factory PharmacyApiService() => _instance;
  PharmacyApiService._internal();

  MobileUserSession? _currentUser;
  String? _lastOrderCode;

  MobileUserSession? get currentUser => _currentUser;
  bool get isLoggedIn => _currentUser != null && _currentUser!.token.isNotEmpty;
  String? get lastOrderCode => _lastOrderCode;

  /// Đăng nhập tài khoản (bảng dbo.users)
  Future<MobileUserSession> login({
    required String username,
    required String password,
  }) async {
    final uri = Uri.parse(ApiConfig.login);
    final response = await http
        .post(
          uri,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Accept': 'application/json',
          },
          body: jsonEncode({
            'username': username.trim(),
            'password': password,
          }),
        )
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200) {
      final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
      _currentUser = MobileUserSession.fromJson(data);
      notifyListeners();
      return _currentUser!;
    } else {
      String msg = 'Tài khoản hoặc mật khẩu không chính xác';
      try {
        final Map<String, dynamic> err = jsonDecode(utf8.decode(response.bodyBytes));
        if (err['message'] != null) msg = err['message'].toString();
      } catch (_) {}
      throw Exception(msg);
    }
  }

  /// Đăng ký tài khoản Khách hàng mới (bảng dbo.users) và tự động đăng nhập
  Future<MobileUserSession> registerCustomer({
    required String username,
    required String password,
    required String fullName,
    String? phone,
    String? email,
  }) async {
    final uri = Uri.parse(ApiConfig.register);
    final response = await http
        .post(
          uri,
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Accept': 'application/json',
          },
          body: jsonEncode({
            'username': username.trim(),
            'password': password,
            'fullName': fullName.trim(),
            'phone': (phone != null && phone.trim().isNotEmpty) ? phone.trim() : null,
            'email': (email != null && email.trim().isNotEmpty) ? email.trim() : null,
            'role': 'CUSTOMER',
          }),
        )
        .timeout(const Duration(seconds: 10));

    if (response.statusCode == 200 || response.statusCode == 201) {
      return await login(username: username, password: password);
    } else {
      String msg = 'Không thể đăng ký tài khoản (Username hoặc Email đã tồn tại)';
      try {
        final Map<String, dynamic> err = jsonDecode(utf8.decode(response.bodyBytes));
        if (err['message'] != null) msg = err['message'].toString();
      } catch (_) {}
      throw Exception(msg);
    }
  }

  void logout() {
    _currentUser = null;
    notifyListeners();
  }

  /// 1. Tìm kiếm và lấy danh mục thuốc từ CSDL thật (SanPham & LoThuoc)
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
      // Fallback sang endpoint danh mục /api/medicines nếu cần
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

    final headers = <String, String>{
      'Content-Type': 'application/json; charset=UTF-8',
      'Accept': 'application/json',
    };
    if (isLoggedIn) {
      headers['Authorization'] = 'Bearer ${_currentUser!.token}';
    }

    final response = await http
        .post(
          uri,
          headers: headers,
          body: jsonEncode(payload),
        )
        .timeout(const Duration(seconds: 12));

    if (response.statusCode == 200 || response.statusCode == 201) {
      final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
      final result = OrderTrackingResult.fromJson(data);
      _lastOrderCode = result.orderNumber;
      notifyListeners();
      return result;
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

  /// 4. Tra cứu hành trình đơn hàng theo mã (VD: MOB-2024-9981 hoặc ONL-...)
  Future<OrderTrackingResult> trackOrder(String orderCode) async {
    final cleaned = orderCode.trim().replaceAll(RegExp(r'^#'), '');
    final uri = Uri.parse(ApiConfig.trackOrder(cleaned));

    final response = await http.get(uri).timeout(const Duration(seconds: 8));

    if (response.statusCode == 200) {
      final Map<String, dynamic> data = jsonDecode(utf8.decode(response.bodyBytes));
      return OrderTrackingResult.fromJson(data);
    } else if (response.statusCode == 404) {
      throw Exception('Không tìm thấy đơn hàng có mã "$cleaned" trong CSDL.');
    } else {
      throw Exception('Không thể tra cứu đơn hàng (HTTP ${response.statusCode})');
    }
  }
}
