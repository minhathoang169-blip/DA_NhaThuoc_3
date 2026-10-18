# Frontend — Quản lý nhà thuốc

Dashboard được xây dựng bằng React và Vite. `package.json` khai báo React, React Router, Axios, Ant Design, MUI/Emotion, Vite và Oxlint.

## Cài dependency và chạy dev server

Từ thư mục gốc dự án, mở PowerShell:

```powershell
Set-Location .\web-pharmacy
npm ci
npm run dev
```

Vite dev server thường chạy tại `http://localhost:5173`. Cần khởi động Backend trước khi tải dữ liệu. Có thể đặt biến `PHARMACY_API_TARGET` để proxy `/api` tới Backend ở cổng/host khác; mặc định là `http://localhost:8080`. `npm ci` tạo/cập nhật `node_modules` theo lockfile.

## Tích hợp API

Frontend gọi API bằng đường dẫn tương đối `/api/...`; không khai báo Axios `baseURL`. [vite.config.js](vite.config.js) proxy `/api` tới `PHARMACY_API_TARGET` hoặc `http://localhost:8080` khi chạy Vite dev server. Cấu hình này không tự áp dụng cho bản build, preview hoặc production.

Tổng quan gọi `GET /api/medicines` không cần đăng nhập. Các màn hình danh mục sử dụng:

- `/api/medicines`
- `/api/batches`
- `/api/customers`
- `/api/employees`
- `/api/suppliers`
- `/api/imports`
- `/api/sales`

Năm danh mục có thao tác GET danh sách/ID, POST, PUT và DELETE. Nhập hàng/bán hàng có tạo phiếu và xem lịch sử; giao dịch đã ghi nhận không cho sửa/xóa. Tồn kho tăng/giảm theo các dòng hàng, không chỉnh tay ở biểu mẫu lô. Backend công khai chỉ GET thuốc; các endpoint quản lý khác yêu cầu HTTP Basic. Form đăng nhập gọi `/api/auth/me`, không tải dữ liệu khách hàng để xác thực.

Đăng nhập Basic Auth xác thực tài khoản nhưng mã hiện tại không có quy tắc phân quyền theo vai trò. Không coi trạng thái đăng nhập giao diện là thay thế cho bảo vệ API phía Backend.

## Script

Khai báo trong `package.json`:

- `npm run dev`: chạy Vite development server.
- `npm run build`: tạo bản build trong `dist/`.
- `npm run lint`: chạy Oxlint.
- `npm run preview`: phục vụ bản build để xem trước.

## Phạm vi hiện tại

Dashboard có trang tổng quan tồn kho và CRUD danh mục sản phẩm, lô thuốc, khách hàng, nhân viên, nhà cung cấp. Chưa thấy UI cho nhập hàng, hóa đơn bán, đơn hàng online hoặc thanh toán. Cấu hình proxy hiện chỉ dành cho Vite dev server; khi triển khai cần cấu hình địa chỉ API/proxy phù hợp.
