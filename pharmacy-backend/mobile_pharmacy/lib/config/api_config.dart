import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';

class ApiConfig {
  static String _customBaseUrl = '';

  static String get defaultHost {
    if (kIsWeb) return 'http://localhost:8080/api';
    try {
      if (Platform.isAndroid) {
        // Địa chỉ kết nối từ Android Emulator về máy chủ Spring Boot trên PC
        return 'http://10.0.2.2:8080/api';
      }
      if (Platform.isIOS) {
        // Địa chỉ kết nối từ iOS Simulator về máy chủ Spring Boot
        return 'http://localhost:8080/api';
      }
    } catch (_) {}
    return 'http://localhost:8080/api';
  }

  static String get baseUrl {
    if (_customBaseUrl.isNotEmpty) {
      return _customBaseUrl;
    }
    return defaultHost;
  }

  static void setBaseUrl(String url) {
    _customBaseUrl = url.trim().replaceAll(RegExp(r'/$'), '');
  }

  // Auth Endpoints (bảng dbo.users)
  static String get login => '$baseUrl/v1/auth/login';
  static String get register => '$baseUrl/v1/auth/register';
  static String get currentUser => '$baseUrl/v1/auth/me';

  // Medicine & FEFO Order Endpoints (bảng SanPham, LoThuoc, online_orders, order_details)
  static String get searchMedicines => '$baseUrl/v1/medicines/search';
  static String medicineSubstitutes(String id) => '$baseUrl/v1/medicines/$id/substitutes';
  static String get onlineCheckout => '$baseUrl/v1/orders/online-checkout';
  static String trackOrder(String code) => '$baseUrl/v1/orders/track/${Uri.encodeComponent(code.trim())}';
}
