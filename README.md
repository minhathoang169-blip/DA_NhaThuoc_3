# Hệ Thống Quản Lý Nhà Thuốc Chuẩn GPP (Pharmacy Management System)

Hệ sinh thái phần mềm quản lý vận hành nhà thuốc toàn diện đạt chuẩn **GPP (Good Pharmacy Practice - Thực hành tốt quản lý nhà thuốc)** của Bộ Y Tế. Hệ thống tích hợp đồng bộ đa kênh: **Web Portal Dược sĩ/Quản lý**, **Hệ thống Backend REST API Spring Boot & CSDL SQL Server**, và **Ứng dụng Di Động Khách Hàng Flutter**.

---

## 📌 Điểm Nổi Bật Của Hệ Thống

1. **Chuẩn Thuật Toán FEFO (First-Expired, First-Out)**:
   - Tự động ưu tiên xuất bán các lô thuốc có hạn sử dụng gần nhất.
   - Phân cấp cảnh báo 4 cấp độ: Khẩn cấp (< 15 ngày), Cảnh báo (16 - 30 ngày), An toàn (> 30 ngày), Đã hết hạn (Chặn xuất kho tại quầy POS và Mobile App).
2. **Gợi Ý Thuốc Thay Thế Cùng Hoạt Chất (INN - International Nonproprietary Names)**:
   - Tự động đề xuất các biệt dược thay thế cùng hoạt chất gốc khi một sản phẩm hết hàng hoặc tồn kho không đủ.
3. **Bán Hàng Tại Quầy (POS Quầy Dược)**:
   - Giao diện chuyên nghiệp chuẩn GPP, hỗ trợ phím tắt (`F2` Quét barcode, `F3` Tìm thuốc, `F4` Chọn khách hàng, `F8` Tiền khách đưa, `F9` Thanh toán & in hóa đơn).
   - Tích hợp chiết khấu VIP (-5%, -10%), điểm tích lũy thành viên và 3 phương thức thanh toán (Tiền mặt, VietQR Pro, Quẹt thẻ POS).
4. **Đồng Bộ Đơn Hàng Mobile App Thời Gian Thực (Live Polling 5s)**:
   - Dược sĩ tiếp nhận, thẩm định đơn thuốc bác sĩ (Rx) có đính kèm ảnh và duyệt trừ kho FEFO trực tiếp.
5. **Báo Cáo Doanh Thu & Vận Hành Đa Chiều**:
   - Biểu đồ biến động doanh thu 7 ngày (Quầy POS vs Mobile App).
   - Biểu đồ Donut cơ cấu kênh bán hàng.
   - Thống kê Top 5 mặt hàng bán chạy nhất và giám sát điều kiện nhiệt độ/độ ẩm kho GPP.
6. **Dữ Liệu Từ Database Được Cấu Hình**:
   - Ứng dụng không tự tạo tài khoản, thuốc, lô hàng, khách hàng hay đơn hàng mẫu. Cần cấu hình database và nạp dữ liệu thực tế trước khi sử dụng.

---

## 🏗 Kiến Trúc Hệ Thống

```text
DA_NhaThuoc_3/
├── pharmacy-backend/              # Spring Boot REST API Service
│   ├── src/main/java/.../         # Controllers, Services, Repositories, Entities, DTOs, Security
│   ├── src/main/resources/        # Cấu hình ứng dụng và script cấu trúc database (không chứa dữ liệu mẫu)
│   ├── src/test/java/.../         # Bộ kiểm thử tự động (FEFO, POS Concurrency, RBAC, Substitute)
│   └── mobile_pharmacy/           # Ứng dụng di động khách hàng Flutter
│       ├── lib/models/            # Medicine, Order, CartItem models
│       ├── lib/screens/           # HomeScreen, CartScreen, CheckoutScreen, OrderTrackingScreen
│       └── lib/services/          # PharmacyApiService, CartManager
└── web-pharmacy/                  # Dashboard Quản Trị & Bán Hàng React / Vite
    ├── src/pages/                 # PosPage, DashboardPage, MedicinesPage, BatchManagementPage, OrdersPage
    ├── src/components/            # PortalLayout, ProtectedRoute, ExpiringAlertBadge
    ├── src/context/               # AuthContext (JWT Authentication & Role Management)
    └── src/services/              # Axios interceptors, TanStack React Query client
```

---

## 🖥 5 Phân Hệ Web Portal Quản Trị ([web-pharmacy](file:///f:/DA_NhaThuoc_3/web-pharmacy))

| Phân hệ | Đường dẫn | Chức năng nghiệp vụ chính |
| :--- | :--- | :--- |
| **1. Bán Hàng Quầy (POS)** | `/pos` | Lập hóa đơn quầy `#POS-8842`, tìm thuốc nhanh theo tên/barcode, thêm vào giỏ, chọn khách hàng VIP, tính chiết khấu, gợi ý tiền đưa, tính tiền thừa và in hóa đơn. |
| **2. Báo Cáo Doanh Thu & Vận Hành** | `/dashboard` | Thống kê tổng doanh thu tích lũy, tổng đơn hoàn tất, cảnh báo cận hạn, tồn kho tối thiểu, biểu đồ 7 ngày, cơ cấu kênh bán và Top 5 thuốc bán chạy. |
| **3. Danh Mục & Hoạt Chất** | `/medicines` | Quản lý danh mục dược phẩm chuẩn hóa INN Bộ Y Tế, mã vạch Barcode EAN-13, phân nhóm điều trị, phân loại Rx / OTC / TPCN, đơn giá và tồn kho an toàn. |
| **4. Quản Lý Lô & Cận Hạn (FEFO)** | `/inventory` | Theo dõi tuổi thọ từng lô thuốc, phân loại Đỏ / Vàng / Xanh, giám sát điều kiện kho Dược GPP (22.4°C / 58%), tạo đơn nhập kho lô mới. |
| **5. Đơn Hàng Mobile App** | `/orders` | Tiếp nhận đơn đặt hàng từ ứng dụng di động khách hàng theo thời gian thực (Live Polling 5s), kiểm tra ảnh đơn thuốc bác sĩ (Rx), bấm "Xác nhận & Trừ kho FEFO". |

---

## ⚙️ Yêu Cầu Môi Trường

- **Java JDK**: Phiên bản 21 hoặc 22.
- **Node.js**: Phiên bản 18+ (Đã xác minh trên Node 24).
- **Cơ sở dữ liệu**: Microsoft SQL Server 2019 / 2022 (Tên CSDL: `QuanLyNhaThuocDB`).
- **Flutter SDK**: Phiên bản 3.x (Dành cho việc biên dịch app di động).

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Ứng Dụng

### 1. Khởi động Backend (Spring Boot)

Mở terminal tại thư mục `pharmacy-backend`:

```powershell
# Thiết lập biến môi trường kết nối SQL Server (nếu cần)
$env:DB_HOST = "localhost"
$env:DB_PORT = "59177"
$env:DB_NAME = "QuanLyNhaThuocDB"

# Khởi chạy ứng dụng Spring Boot với profile SQL Server
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=sqlserver"
```
- Backend REST API chạy tại: **`http://localhost:8080`**

### 2. Khởi động Web Dashboard (React + Vite)

Mở terminal tại thư mục `web-pharmacy`:

```powershell
# Cài đặt thư viện dependencies
npm.cmd install

# Chạy môi trường phát triển Vite
npm.cmd run dev
```
- Giao diện web chạy tại: **`http://localhost:5173`**

### 3. Tài Khoản Đăng Nhập

Ứng dụng không tạo sẵn tài khoản. Quản trị viên database/hệ thống cần tạo tài khoản thật với vai trò phù hợp trước khi đăng nhập; không có username hoặc password mặc định trong source code.

---

## 🧪 Kiểm Thử Tự Động (Automated Tests)

Dự án đã tích hợp đầy đủ bộ kiểm thử tự động đảm bảo độ ổn định và an toàn nghiệp vụ:

1. **Backend Integration Tests**:
   - `PosConcurrencyTest`: Kiểm tra giao dịch bán hàng đồng thời và khóa lạc quan (Optimistic Locking) tránh thất thoát kho.
   - `FefoInventoryServiceTest`: Kiểm tra xuất kho tuân thủ nghiêm ngặt theo thứ tự hạn sử dụng gần nhất.
   - `SubstituteMedicineTest`: Kiểm tra logic tìm kiếm biệt dược thay thế cùng hoạt chất INN.
   - `SecurityRbacTest`: Kiểm tra phân quyền truy cập và bảo mật Token JWT.

```powershell
# Chạy toàn bộ test suite của backend
cd pharmacy-backend
.\mvnw.cmd test
```

2. **Frontend Linter & Build Check**:
```powershell
cd web-pharmacy
npm.cmd run lint
npm.cmd run build
```

---

## 👥 Nhóm Tác Giả & Bản Quyền

- Dự án: **Hệ Thống Quản Lý Dược Chuẩn GPP**
- Repository: [https://github.com/minhathoang169-blip/DA_NhaThuoc_3](https://github.com/minhathoang169-blip/DA_NhaThuoc_3)
- Nhánh phát triển: `cap-nhat-4`
