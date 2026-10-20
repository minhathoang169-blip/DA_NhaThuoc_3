# Frontend — Quản lý nhà thuốc

Frontend là dashboard React/JavaScript dùng Vite. `package.json` khai báo React `^19.2.8`, React DOM `^19.2.8`, React Router `^7.18.4`, Axios `^1.20.0`, Ant Design, MUI/Emotion; công cụ phát triển gồm Vite `^8.3.0`, plugin React và Oxlint.

## Môi trường Node.js/npm

Đã xác minh trực tiếp:

- Node.js `v24.22.0`: `F:\User\MypC\node.exe`
- npm `11.19.1`: `F:\User\MypC\npm.cmd`

Các đường dẫn này chưa có trong PATH của phiên PowerShell kiểm tra và chưa được xác nhận trong PATH vĩnh viễn. Thêm PATH tạm thời cho **cửa sổ hiện tại**:

```powershell
$env:Path = "F:\User\MypC;$env:Path"
node.exe --version
npm.cmd --version
```

Nếu PowerShell chặn `npm` vì chọn file `npm.ps1` theo Execution Policy, gọi `npm.cmd` như các lệnh bên dưới. Không cần đổi Execution Policy hoặc PATH vĩnh viễn.

## Cài dependency và chạy development server

Từ PowerShell:

```powershell
Set-Location 'F:\File DA\DA_NhaThuoc_3-cap-nhat-1\web-pharmacy'
if (-not (Test-Path .\node_modules)) { npm.cmd ci }
npm.cmd run dev
```

`node_modules` chưa có tại lần kiểm tra gần nhất nên điều kiện sẽ gọi `npm.cmd ci`. Lệnh này cài package và tạo thư mục `node_modules`; **README chỉ hướng dẫn, Codex không thực hiện cài đặt**. Nếu đã có `node_modules`, bỏ qua bước cài. Khi Vite chạy, URL mặc định là `http://localhost:5173`; nếu cổng bận, Vite có thể chọn cổng khác và in URL chính xác trong terminal.

Frontend gọi API bằng đường dẫn tương đối `/api/...`. [vite.config.js](vite.config.js) proxy các request `/api` tới `http://localhost:8080` trong dev server. Vì vậy hãy khởi động Backend trước. Cấu hình proxy hiện thấy áp dụng cho Vite dev server; môi trường deploy/preview cần có proxy tương ứng.

Dừng development server bằng `Ctrl+C` trong terminal Vite.

## Các script có trong package.json

Chạy từ `web-pharmacy` sau khi dependency đã cài:

```powershell
npm.cmd run build
npm.cmd run lint
npm.cmd run preview
```

- `build` chạy `vite build` và tạo/cập nhật `dist/`.
- `lint` chạy Oxlint.
- `preview` chạy `vite preview` để xem bản build; thường chạy `build` trước. Các lệnh build/preview tạo hoặc dùng artifact trong `dist/`.

Các lệnh này chưa được chạy trong lần cập nhật README.

## Màn hình và API

- **Tổng quan:** gọi `GET /api/medicines`, hiển thị sản phẩm, tồn tổng hợp, giá trị tồn, lọc tồn thấp/gần hạn và tìm kiếm.
- **Danh mục:** sản phẩm, lô thuốc, khách hàng, nhân viên, nhà cung cấp; `CrudModule.jsx` gọi GET/POST/PUT/DELETE tương ứng.
- **API base path:** không có Axios `baseURL` riêng; Vite proxy `/api` tới `localhost:8080`.

Backend hiện có Controller cho năm nhóm danh mục nói trên. Chưa thấy giao diện/API nhập hàng, hóa đơn bán, đơn hàng online hoặc thanh toán. Dữ liệu dashboard phụ thuộc API; UI không có bằng chứng về danh sách mẫu hard-code.

## Đăng nhập và trạng thái bảo mật

Giao diện có form đăng nhập; `apiAuth.js` thử GET `/api/customers` với HTTP Basic. Tuy nhiên, `SecurityConfig` Backend hiện cho phép mọi request, tắt Basic Auth/form login và CSRF. Do đó form chỉ điều khiển hiển thị màn hình phía Frontend, không bảo vệ API ở server. Chỉ dùng trong môi trường phát triển cô lập; không dùng cấu hình hiện tại cho production.

## Chưa xác minh

- Không có `node_modules` ở lần kiểm tra gần nhất; chưa xác minh package đã cài hoặc frontend build được.
- Người dùng chưa xác nhận Frontend chạy thực tế. Codex chưa gọi API hoặc mở giao diện.
- Người dùng báo một số API đã trả JSON; điều đó chưa xác nhận Frontend hoạt động end-to-end.

Xem [README tổng quan](../README.md) và [README Backend](../pharmacy-backend/README.md) để chạy toàn bộ dự án.
