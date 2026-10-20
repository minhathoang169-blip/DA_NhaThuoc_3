# Quản lý nhà thuốc

Dự án gồm API Spring Boot, dashboard React/Vite và một ứng dụng Flutter mẫu. Backend hiện có API danh mục cho sản phẩm, lô thuốc, khách hàng, nhân viên và nhà cung cấp. Script SQL Server mô tả thêm các bảng nhập hàng và đơn bán.

## Trạng thái đã xác minh

- Backend: Spring Boot `4.1.1`, Java yêu cầu `22`, Maven Wrapper khai báo Maven `3.9.16`.
- Java JDK `22.0.2` có tại `C:\Program Files\Java\jdk-22`. Java/Javac không nằm trong PATH của phiên terminal đã kiểm tra.
- Frontend: React `^19.2.8`, Vite `^8.3.0`, Axios; các script thực tế xem trong `web-pharmacy/package.json`.
- Node.js `v24.22.0` và npm `11.19.1` đã được xác minh khi gọi trực tiếp tại `F:\User\MypC`. Thư mục này chưa có trong PATH của phiên kiểm tra; chưa xác minh PATH vĩnh viễn.
- SQL Server profile dùng Windows Integrated Authentication. Cấu hình có sẵn ở `pharmacy-backend/src/main/resources/application-sqlserver.properties`.
- Người dùng báo đã chạy `data.sql` bằng SQLCMD với exit code 0 và sau đó `/api/medicines`, `/api/customers`, `/api/employees` trả dữ liệu. Codex chưa kết nối SQL Server hoặc gọi API để xác minh độc lập.
- Frontend dependencies chưa được cài trong `web-pharmacy/node_modules` tại lần kiểm tra gần nhất.
- Không thấy thư mục `.git` ở gốc dự án; lệnh Git báo đây không phải repository. Không thể cung cấp trạng thái thay đổi Git.

## Kiến trúc và thư mục

```text
.
├── pharmacy-backend/       # Spring Boot, JPA, Security, SQL Server/H2
│   ├── src/main/java/      # API, Entity, Repository, seeder
│   ├── src/main/resources/ # application*.properties và data.sql
│   └── mobile_pharmacy/    # Flutter skeleton
├── web-pharmacy/           # React/Vite dashboard
└── postman/                # Collection API
```

Backend dùng Repository trực tiếp từ các Controller; chưa thấy package Service riêng. Entity `Medicine` và `MedicineBatch` ánh xạ lần lượt vào bảng tiếng Việt `SanPham` và `LoThuoc`. Một số Entity khác chưa khớp các bảng trong script SQL; xem [hướng dẫn Backend](pharmacy-backend/README.md).

## Yêu cầu môi trường

- JDK 22. Maven Wrapper có sẵn; lần chạy đầu có thể tải Maven và dependency.
- Node.js/npm. Môi trường phát triển đã xác minh Node `24.22.0`, npm `11.19.1` tại `F:\User\MypC` của Nhật.
- SQL Server chỉ khi dùng profile `sqlserver`; cần SQL Server nghe TCP/IP trên host/port đã cấu hình và tài khoản Windows có quyền database.
- Flutter/Dart chỉ khi muốn mở ứng dụng di động mẫu. Metadata hiện có ghi Flutter `3.47.7`, Dart `3.13.5`; mobile app chưa tích hợp API.

## Chạy Backend

Mở PowerShell. Các lệnh sau chỉ đặt Java trong **phiên PowerShell hiện tại**, không sửa PATH vĩnh viễn:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-22'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
javac -version
```

Từ thư mục dự án, chạy profile mặc định `local`:

```powershell
Set-Location 'F:\File DA\DA_NhaThuoc_3-cap-nhat-1\pharmacy-backend'
.\mvnw.cmd --version
.\mvnw.cmd spring-boot:run
```

`application.properties` đặt `spring.profiles.default=local`. `LocalDataSeeder` chỉ thêm 3 sản phẩm và 4 lô qua Repository khi chưa có sản phẩm. Dữ liệu không bị seeder xóa; datasource local có thể bị cấu hình bên ngoài ghi đè.

Muốn chạy SQL Server, trước tiên xác nhận schema và service đã sẵn sàng, sau đó trong cùng PowerShell:

```powershell
$env:DB_HOST = 'localhost'
$env:DB_PORT = '1433'
$env:DB_NAME = 'QuanLyNhaThuocDB'
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=sqlserver"
```

Profile SQL Server đặt `ddl-auto=none` và SQL init bị tắt; backend không tự tạo schema từ Entity. Chi tiết xác thực, script database và log nằm trong [README Backend](pharmacy-backend/README.md).

## Chạy Frontend

Mở PowerShell thứ hai:

```powershell
$env:Path = "F:\User\MypC;$env:Path"
node.exe --version
npm.cmd --version
Set-Location 'F:\File DA\DA_NhaThuoc_3-cap-nhat-1\web-pharmacy'
if (-not (Test-Path .\node_modules)) { npm.cmd ci }
npm.cmd run dev
```

`npm ci` chỉ cài dependency khi `node_modules` chưa tồn tại; lệnh này ghi thư mục dependency. Dùng `npm.cmd` nếu PowerShell chặn `npm.ps1` do Execution Policy. Không cần và không nên đổi Execution Policy chỉ để chạy dự án.

Vite proxy `/api` tới `http://localhost:8080`. Vite mặc định mở dashboard tại `http://localhost:5173` nếu cổng này còn trống. Dừng mỗi server bằng `Ctrl+C` trong terminal tương ứng.

## URL API

- `GET http://localhost:8080/api/medicines`
- `/api/batches`, `/api/customers`, `/api/employees`, `/api/suppliers`: các nhóm có GET danh sách/ID, POST, PUT và DELETE.
- Frontend dev server: `http://localhost:5173` (mặc định Vite; có thể đổi cổng nếu cổng bận).

Các URL trên được xác định từ cấu hình/mã nguồn; trạng thái truy cập hiện thời chưa được Codex kiểm tra trực tiếp.

## Database và lưu ý an toàn

`pharmacy-backend/src/main/resources/data.sql` là script SQL Server tạo database, bảng, khóa, index, computed columns, trigger tồn kho và dữ liệu mẫu. **Không chạy lại trên database đã có dữ liệu nếu chưa xác minh tác động**: script không phải migration idempotent, có `CREATE DATABASE`/`CREATE TABLE` và INSERT. Người dùng báo đã chạy script thành công qua SQLCMD; database thực tế chưa được Codex xác minh.

Cấu hình hiện tại trong `SecurityConfig` cho phép mọi request, tắt HTTP Basic/form login và tắt CSRF. Vì vậy đăng nhập ở UI không bảo vệ API phía server. Chỉ dùng trong môi trường phát triển cô lập; không đưa cấu hình hiện tại lên production.

## Kiểm tra và giới hạn

- README trước ghi Newman đã chạy 25 request/25 assertion; đây là thông tin tài liệu lịch sử, chưa chạy lại trong lần cập nhật.
- Backend test có CRUD danh mục và test mong đợi request ghi/GET dữ liệu cá nhân bị 401. Kỳ vọng này hiện không khớp `SecurityConfig` đang `permitAll`; test chưa được chạy.
- Chưa xác minh độc lập kết nối SQL Server, profile đang active trong tiến trình, API hiện tại, build Backend hoặc Frontend.
- Ứng dụng Flutter vẫn là skeleton bộ đếm mặc định, chưa gọi API nghiệp vụ.

Chi tiết: [Backend](pharmacy-backend/README.md) · [Frontend](web-pharmacy/README.md).
