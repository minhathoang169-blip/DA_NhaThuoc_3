# Backend — Quản lý nhà thuốc

Backend là REST API bằng Spring Boot, Java, Spring Data JPA và Spring Security. Controller hiện có cho sản phẩm, lô thuốc, khách hàng, nhân viên và nhà cung cấp; các Controller gọi Repository trực tiếp, chưa thấy package Service riêng.

## Môi trường

- JDK `22` theo `pom.xml`; JDK `22.0.2` đã được xác minh tại `C:\Program Files\Java\jdk-22`.
- Maven Wrapper có trong thư mục này; `.mvn/wrapper/maven-wrapper.properties` khai báo Maven `3.9.16`. Lệnh wrapper có thể tải Maven/dependencies nếu chưa có cache.
- SQL Server JDBC và H2 được khai báo là runtime dependencies.

### Java trong PowerShell hiện tại

Các lệnh sau thiết lập Java chỉ cho cửa sổ PowerShell hiện tại, không sửa PATH vĩnh viễn:

```powershell
$env:JAVA_HOME = 'C:\Program Files\Java\jdk-22'
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
javac -version
```

Từ thư mục `pharmacy-backend`, kiểm tra Maven Wrapper:

```powershell
Set-Location 'F:\DA_NhaThuoc_3\pharmacy-backend'
.\mvnw.cmd --version
```

Lần đầu gọi wrapper có thể tải Maven từ kho Maven Central và ghi cache cục bộ. Không chạy lệnh này nếu không muốn tải hoặc tạo cache.

## Profile và database

`src/main/resources/application.properties` đặt profile mặc định là `sqlserver` và `spring.sql.init.mode=never`. Ứng dụng không tự chạy script SQL và không tự tạo tài khoản, thuốc, lô thuốc hay đơn hàng mẫu. Database phải được quản trị viên cấu hình và cấp dữ liệu thật.

Profile `sqlserver` kết nối tới `127.0.0.1:1433`, database `QuanLyNhaThuocDB` theo mặc định; có thể đổi bằng `DB_HOST`, `DB_PORT`, `DB_NAME`. Xác thực dùng Windows Integrated Security của tài khoản chạy Backend. `spring.jpa.hibernate.ddl-auto=update`; khi kết nối được database, Hibernate có thể cập nhật cấu trúc bảng. Mỗi máy cần cấu hình SQL Server và quyền truy cập riêng.

Hai script cấu trúc là `src/main/resources/schema.sql` và `src/main/resources/schema_extensions.sql`. Chúng chỉ tạo/cập nhật schema, không thêm dữ liệu. `schema.sql` có `CREATE DATABASE` và không an toàn để chạy lại; `schema_extensions.sql` yêu cầu schema cơ sở đã tồn tại và có các lệnh `ALTER TABLE`. Chỉ quản trị viên database mới nên chạy script phù hợp với trạng thái thực tế của database. Các script không được Spring tự động thực thi.

Nếu đã xác nhận cần tạo database/schema mới, quản trị viên có thể chạy từ `pharmacy-backend` bằng Windows Authentication:

```powershell
Set-Location 'F:\DA_NhaThuoc_3\pharmacy-backend'
sqlcmd -S localhost,1433 -E -b -i .\src\main\resources\schema.sql
sqlcmd -S localhost,1433 -E -b -i .\src\main\resources\schema_extensions.sql
```

Các lệnh trên **ghi thay đổi vào SQL Server** và tạo/cập nhật schema. Không chạy lại trên database đã có hoặc chưa kiểm tra cấu trúc. `-b` yêu cầu SQLCMD báo lỗi qua exit code khi statement lỗi; exit code 0 không thay thế việc xác minh schema sau chạy. Script không chèn người dùng mặc định; quản trị viên phải thiết lập tài khoản theo quy trình triển khai riêng.

### Chạy Backend với SQL Server

Mở PowerShell tại thư mục Backend, thiết lập Java như trên, sau đó:

```powershell
$env:DB_HOST = 'localhost'
$env:DB_PORT = '1433'
$env:DB_NAME = 'QuanLyNhaThuocDB'
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=sqlserver"
```

`DB_HOST`, `DB_PORT`, `DB_NAME` là biến môi trường của cửa sổ hiện tại; đóng cửa sổ sẽ bỏ các giá trị này. Cần SQL Server đang chạy, bật TCP/IP và nghe đúng host/cổng; tài khoản Windows của tiến trình phải có quyền database. Backend mặc định nghe cổng `8080`. Dừng bằng `Ctrl+C` trong terminal.

### Lưu log

Chạy từ `pharmacy-backend` để vừa xem log trong terminal vừa ghi ra `backend.log`:

```powershell
.\mvnw.cmd spring-boot:run "-Dspring-boot.run.profiles=sqlserver" 2>&1 | Tee-Object -FilePath .\backend.log
```

Lệnh tạo/ghi file log trong thư mục Backend và lệnh khởi động có thể tải dependency, biên dịch hoặc kết nối database. Không chia sẻ log trước khi che thông tin xác thực, URL nhạy cảm và dữ liệu cá nhân. Dừng bằng `Ctrl+C`.

## API

GET công khai hiện có:

```powershell
$urls = @(
  'http://localhost:8080/api/medicines',
  'http://localhost:8080/api/customers',
  'http://localhost:8080/api/employees'
)
foreach ($url in $urls) {
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Uri $url -Method Get
    "$url -> HTTP $($response.StatusCode)"
  } catch {
    "$url -> request lỗi; xem status và log Backend"
  }
}
```

Lệnh chỉ gửi GET và chỉ in status code, không in nội dung hồ sơ khách hàng/nhân viên. Không chạy khi Backend chưa được khởi động.

Các nhóm API danh mục có GET danh sách, GET theo ID, POST, PUT và DELETE tại `/api/medicines`, `/api/batches`, `/api/customers`, `/api/employees`, `/api/suppliers`.

## Lỗi thường gặp

- **Không kết nối được database:** kiểm tra profile active, service SQL Server, TCP/IP, host/cổng, tên database, tài khoản Windows và quyền. Phân biệt `connection refused`/timeout với lỗi đăng nhập.
- **HTTP 404:** kiểm tra đúng cổng `8080`, đúng endpoint và Controller có được đăng ký theo profile hiện tại hay không.
- **HTTP 500:** đây là lỗi tổng quát; xem exception sâu nhất sau `Caused by:` trong terminal/log. Không kết luận là sai mapping nếu chưa thấy lỗi cụ thể.
- **`Invalid object name 'SanPham'` hoặc `LoThuoc`:** kiểm tra database/schema đang kết nối, default schema của tài khoản và tên bảng thực tế. Entity dùng tên tiếng Việt; profile hiện có naming strategy giữ tên vật lý.
- **Lỗi Native Authentication/DLL:** kiểm tra DLL trong `target/native` và cách khởi động có áp dụng `java.library.path` hay không.

## Bảo mật và trạng thái

`SecurityConfig` hiện gọi `anyRequest().permitAll()`, tắt HTTP Basic, form login và CSRF. API hiện không được bảo vệ bằng xác thực server; màn hình đăng nhập Frontend không thay thế xác thực Backend. **Chỉ dùng trong môi trường phát triển cô lập, không triển khai production với cấu hình này.**

Test hiện có gồm tải context, CRUD danh mục và hai test mong đợi request trái phép nhận 401. Hai kỳ vọng 401 không khớp SecurityConfig hiện tại; chưa chạy test. Người dùng báo API thuốc/khách hàng/nhân viên đã trả JSON; trạng thái runtime chưa được Codex tự xác minh.

Schema mở rộng nằm trong `schema_extensions.sql`. Các API giao dịch phụ thuộc các bảng tương ứng và database đã được quản trị viên cấu hình; dự án không chèn tài khoản hoặc dữ liệu mẫu để làm sẵn màn hình.
