# Nhà Thuốc Dược An — Ứng dụng Mobile (Android & iOS)

Ứng dụng di động **Nhà Thuốc Dược An** được xây dựng bằng **Flutter (Android & iOS)** dành cho **Khách hàng**, kết nối trực tiếp với **Spring Boot Backend (`pharmacy-backend`)** và cơ sở dữ liệu **SQL Server (`QuanLyNhaThuocDB`)**.

---

## 1. Cấu trúc nền tảng (Chỉ Android & iOS)

Dự án chỉ bao gồm 2 nền tảng di động:
- **`android/`**: Cấu hình Android (`AndroidManifest.xml` đã bật quyền `INTERNET`, `ACCESS_NETWORK_STATE` và `usesCleartextTraffic="true"` để gọi API HTTP local qua `10.0.2.2:8080`).
- **`ios/`**: Cấu hình iOS (`Info.plist` đã cấu hình `NSAppTransportSecurity` cho phép kết nối HTTP local `localhost:8080`).
- **`lib/`**:
  - `config/api_config.dart`: Tự động nhận diện `http://10.0.2.2:8080/api` trên **Android Emulator** và `http://localhost:8080/api` trên **iOS Simulator**.
  - `models/medicine.dart`: Model thuốc, lô FEFO, giỏ hàng và đơn hàng trực tuyến.
  - `services/pharmacy_api_service.dart`: Gọi API Đăng nhập, Đăng ký, Tìm kiếm thuốc, Thuốc thay thế cùng hoạt chất, Đặt hàng Online và Tra cứu vận đơn.
  - `screens/home_screen.dart`: Trang chủ tìm kiếm thuốc, lọc theo danh mục & xem thuốc thay thế.
  - `screens/cart_checkout_screen.dart`: Giỏ hàng & Thanh toán đơn hàng Online (tự động điền thông tin nếu đã đăng nhập).
  - `screens/order_tracking_screen.dart`: Tra cứu trạng thái đơn hàng theo mã đơn (`ORD-...`).
  - `screens/account_screen.dart`: Đăng nhập & Đăng ký tài khoản Khách hàng (`CUSTOMER`).

---

## 2. Tài khoản Khách hàng thử nghiệm

| Vai trò | Tên đăng nhập (`username`) | Mật khẩu (`password`) | Ghi chú |
| :--- | :--- | :--- | :--- |
| **Khách hàng có sẵn** | `customer` | `customer123` | Đồng bộ với bảng `dbo.users` trong `QuanLyNhaThuocDB` |
| **Khách hàng mới** | *Tự đăng ký trên App* | *Tự đặt (tối thiểu 6 ký tự)* | Tạo trực tiếp qua tab **Tài khoản -> Đăng ký tài khoản** |

---

## 3. Hướng dẫn chạy ứng dụng (Android & iOS)

### Bước 1: Đảm bảo Backend Spring Boot đang chạy ở cổng `8080`
Từ thư mục `c:\DA_NhaThuoc_3\pharmacy-backend`:
```powershell
mvn spring-boot:run
```

### Bước 2: Cài đặt thư viện Flutter
```powershell
cd c:\DA_NhaThuoc_3\pharmacy-backend\mobile_pharmacy
F:\User\src\flutter\bin\flutter.bat pub get
```

### Bước 3: Chạy trên máy ảo Android hoặc iOS
- **Chạy trên Android Emulator**:
  ```powershell
  F:\User\src\flutter\bin\flutter.bat run -d android
  ```
- **Chạy trên iOS Simulator (macOS)**:
  ```powershell
  flutter run -d ios
  ```
- **Chạy trên điện thoại Android/iOS thật (cùng mạng Wi-Fi)**:
  Thay đổi IP máy tính chạy Backend thông qua `--dart-define`:
  ```powershell
  F:\User\src\flutter\bin\flutter.bat run --dart-define=API_BASE_URL=http://192.168.1.100:8080/api
  ```

---

## 4. Kiểm tra mã nguồn & Unit Test
```powershell
F:\User\src\flutter\bin\flutter.bat analyze
F:\User\src\flutter\bin\flutter.bat test
```
