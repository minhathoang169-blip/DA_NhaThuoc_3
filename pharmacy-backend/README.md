# Backend — Quản lý nhà thuốc

Backend REST API dùng Spring Boot, Spring Data JPA và Spring Security. API hỗ trợ danh mục sản phẩm, lô thuốc, khách hàng, nhân viên, nhà cung cấp, phiếu nhập và đơn bán. Nhập/bán cập nhật tồn theo lô trong cùng transaction; giao dịch đã ghi nhận chỉ đọc để bảo toàn lịch sử. Ở profile SQL Server, trigger tồn kho trong schema hiện có cập nhật số lượng khi ghi chi tiết phiếu; profile local cập nhật tồn trong service.

## Môi trường và chạy local

Yêu cầu JDK 22. Maven Wrapper có sẵn tại thư mục này; lần chạy đầu có thể cần Maven/dependency cache.

```powershell
Set-Location .\pharmacy-backend
.\mvnw.cmd spring-boot:run
```

Profile mặc định là `local`. H2 có trong dependency runtime; khi không có cấu hình datasource bên ngoài, Spring Boot có thể dùng H2. `LocalDataSeeder` chèn dữ liệu qua Repository nếu chưa có sản phẩm. Seeder không đọc `data.sql`.

## SQL Server

Cấu hình nằm trong `src/main/resources/application-sqlserver.properties`. Profile dùng Microsoft SQL Server JDBC Driver, Windows Integrated/Native Authentication và mặc định `localhost:1433` với database `QuanLyNhaThuocDB`. Biến `DB_HOST`, `DB_PORT`, `DB_NAME` có thể ghi đè các giá trị mặc định trong môi trường tiến trình.

```powershell
$env:DB_HOST = 'localhost'
$env:DB_PORT = '1433'
$env:DB_NAME = 'QuanLyNhaThuocDB'
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=sqlserver"
```

Profile SQL Server đặt `spring.jpa.hibernate.ddl-auto=none` và `spring.sql.init.mode=never`; ứng dụng không tự tạo schema hoặc chạy `data.sql`. Entity ánh xạ một số bảng tiếng Việt như `SanPham`, `LoThuoc`, `KhachHang`, `NhanVien`, `NhaCungCap`.

`src/main/resources/data.sql` tạo database, bảng, khóa/index, computed columns, trigger tồn kho và dữ liệu mẫu. Đây là script khởi tạo không idempotent; không chạy lại trên database đã có dữ liệu nếu chưa đánh giá tác động và có phê duyệt.

## Phạm vi HTTP Basic

Theo `config/SecurityConfig.java`:

- Công khai: `GET /api/medicines` và `GET /api/medicines/{id}`.
- Cần HTTP Basic: các endpoint `/api/**` khác, gồm GET lô thuốc/khách hàng/nhân viên/nhà cung cấp và các POST/PUT/DELETE.
- Bị từ chối: route không khớp `/api/**`.

Không thấy `UserDetailsService`, `PasswordEncoder`, kho tài khoản riêng hay rule kiểm tra theo vai trò trong mã hiện tại. Spring Boot dùng tài khoản phát triển mặc định và sinh mật khẩu ngẫu nhiên trong log khởi động. Đây không phải cơ chế quản lý tài khoản production; không chia sẻ log chứa thông tin xác thực.

Frontend gửi Basic Auth khi mở màn hình danh mục; Postman collection cũng khai báo Basic Auth cấp collection. Màn hình tổng quan chỉ cần endpoint thuốc công khai.

## Kiểm thử

Test trong `src/test/java/.../PharmacyBackendApplicationTests.java` gồm tải Spring context, CRUD danh mục và hai kiểm tra yêu cầu HTTP 401 khi request không xác thực. Chưa có test chuyên biệt cho SQL Server thật, trigger tồn kho, nhập hàng/bán hàng hoặc phân quyền theo vai trò.

Sau khi xác nhận Maven Wrapper và dependency đã có cache, có thể chạy kiểm thử offline bằng:

```powershell
.\mvnw.cmd -o test
```

Chế độ `-o` ngăn Maven truy cập mạng; nếu thiếu artifact trong cache, lệnh sẽ thất bại thay vì tải xuống. Test mặc định không xác minh database SQL Server thật.

## API danh mục

Các nhóm `/api/medicines`, `/api/batches`, `/api/customers`, `/api/employees`, `/api/suppliers` có GET danh sách, GET theo ID, POST, PUT theo ID và DELETE theo ID. `/api/imports` và `/api/sales` có GET lịch sử và POST tạo giao dịch; chúng không có PUT/DELETE để giữ lịch sử tồn kho. `/api/auth/me` xác thực thông tin HTTP Basic mà không tải dữ liệu khách hàng.

Tồn kho lô mới khởi tạo bằng 0. Số lượng tồn không thể sửa qua CRUD lô; API giao dịch là nguồn cập nhật tồn duy nhất. Giao dịch không cho phép nhập/bán lô đã hết hạn; bán hàng khóa lô và từ chối số lượng vượt tồn.

`SecurityConfig` tắt CSRF và bật HTTP Basic. Không triển khai môi trường production trước khi có thiết kế xác thực, quản lý tài khoản, phân quyền và cấu hình bảo mật phù hợp.
