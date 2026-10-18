# Quản lý nhà thuốc

Dự án gồm Backend REST API bằng Spring Boot, dashboard web React/Vite, collection Postman và một ứng dụng Flutter mẫu. Backend và dashboard dùng chung các API cho danh mục sản phẩm, lô thuốc, khách hàng, nhân viên, nhà cung cấp, nhập hàng và bán hàng.

## Cấu trúc

- `pharmacy-backend/`: Spring Boot, JPA, cấu hình H2/SQL Server, test và script SQL Server.
- `web-pharmacy/`: ứng dụng React/Vite.
- `pharmacy-backend/mobile_pharmacy/`: skeleton Flutter, hiện chưa tích hợp API nghiệp vụ.
- `postman/Quan-ly-nha-thuoc.postman_collection.json`: request kiểm tra CRUD API.

Các Controller danh mục giữ CRUD đơn giản; nghiệp vụ nhập/bán dùng Service transaction riêng để ghi lịch sử theo lô và cập nhật tồn cùng lúc. Giao dịch đã ghi nhận là lịch sử, không sửa/xóa để tránh làm sai tồn kho; lô đã có lịch sử cũng không cho sửa thông tin định danh/hạn dùng. Đơn hàng online và thanh toán chưa nằm trong phạm vi dashboard quản trị này.

## Yêu cầu

- JDK 22; Maven Wrapper nằm trong `pharmacy-backend/`.
- Node.js và npm phù hợp với Vite 8.
- SQL Server chỉ cần khi chạy profile `sqlserver`.
- Flutter SDK chỉ cần nếu phát triển ứng dụng mobile.

## Chạy Backend local

Từ thư mục gốc dự án, mở PowerShell:

```powershell
Push-Location .\pharmacy-backend
.\mvnw.cmd spring-boot:run
Pop-Location
```

Profile mặc định là `local`. H2 được dùng khi có trên classpath và không có datasource bên ngoài ghi đè cấu hình. `LocalDataSeeder` thêm dữ liệu mẫu qua Repository khi chưa có sản phẩm; không đọc `data.sql`.

Backend lắng nghe tại `http://localhost:8080`.

### Chạy với SQL Server

Profile SQL Server dùng Windows Integrated Authentication và mặc định trỏ `localhost:1433`, database `QuanLyNhaThuocDB`. Cần database/schema đã được tạo trước; profile đặt `spring.jpa.hibernate.ddl-auto=none` và ứng dụng không tự chạy SQL init.

```powershell
$env:DB_HOST = 'localhost'
$env:DB_PORT = '1433'
$env:DB_NAME = 'QuanLyNhaThuocDB'
Push-Location .\pharmacy-backend
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=sqlserver"
Pop-Location
```

`data.sql` là script tạo database, bảng, ràng buộc, trigger và dữ liệu mẫu. Script có lệnh `CREATE DATABASE`/`CREATE TABLE`, không phải migration chạy lặp an toàn; chỉ chạy riêng khi đã kiểm tra database đích và được phép thay đổi dữ liệu.

## Xác thực API

Spring Security dùng HTTP Basic. `GET /api/medicines` và `GET /api/medicines/{id}` được công khai. Các endpoint `/api/**` khác, bao gồm GET danh mục khác và mọi POST/PUT/DELETE, yêu cầu xác thực. Route ngoài `/api/**` bị từ chối.

Không thấy cấu hình phân quyền theo vai trò trong mã hiện tại. Spring Boot cung cấp tài khoản phát triển mặc định; mật khẩu ngẫu nhiên được in trong log khi khởi động. Không dùng cấu hình tài khoản phát triển cho production.

## Chạy Frontend

Mở terminal thứ hai từ thư mục gốc:

```powershell
Push-Location .\web-pharmacy
npm ci
npm run dev
Pop-Location
```

Vite dev server thường dùng `http://localhost:5173` và proxy `/api` tới Backend ở `http://localhost:8080`. Proxy này chỉ áp dụng cho dev server; môi trường triển khai cần cấu hình API/proxy riêng.

Các script khác trong `web-pharmacy/package.json`: `npm run build`, `npm run lint`, `npm run preview`.

## Postman

Import `postman/Quan-ly-nha-thuoc.postman_collection.json`. Collection dùng HTTP Basic Auth thông qua biến collection; cấu hình giá trị xác thực cục bộ từ thông tin Backend in khi khởi động. Không đưa thông tin xác thực vào Git hoặc chia sẻ log chưa được rà soát.

## Giới hạn đã biết

- Test bảo mật kỳ vọng request không xác thực bị HTTP 401; cần chạy test để xác minh trạng thái hiện tại.
- SQL Server service, TCP/IP, database và dữ liệu thực tế chưa được xác minh chỉ từ mã nguồn.
- Ứng dụng Flutter hiện là skeleton, chưa gọi API nghiệp vụ.
- API chỉ có bằng chứng CRUD cho năm nhóm danh mục; chưa có luồng bán hàng/nhập hàng hoàn chỉnh.
