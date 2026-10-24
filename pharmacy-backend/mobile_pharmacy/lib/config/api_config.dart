import 'dart:io' show Platform;
import 'package:flutter/foundation.dart';

class ApiConfig {
  // Có thể tùy biến host động trong ứng dụng
  static String _customBaseUrl = '';

  static String get defaultHost {
    if (kIsWeb) return 'http://localhost:8080/api';
    try {
      if (Platform.isAndroid) {
        // Địa chỉ kết nối từ Android Emulator về máy host
        return 'http://10.0.2.2:8080/api';
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
    _customBaseUrl = url.trim();
  }

  // Endpoints
  static String get searchMedicines => '$baseUrl/v1/medicines/search';
  static String medicineSubstitutes(String id) => '$baseUrl/v1/medicines/$id/substitutes';
  static String get onlineCheckout => '$baseUrl/v1/orders/online-checkout';
  static String trackOrder(String code) => '$baseUrl/v1/orders/track/$code';
}
