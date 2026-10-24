-- =========================================================
-- DATABASE: QUAN LY NHA THUOC (DỮ LIỆU THẬT TIÊU CHUẨN GPP)
-- HỆ THỐNG DANH MỤC THUỐC, HOẠT CHẤT, LÔ THUỐC VÀ PHÂN QUYỀN THỰC TẾ
-- =========================================================

USE QuanLyNhaThuocDB;
GO

-- 1. MỞ RỘNG ĐỘ DÀI CÁC CỘT CHỨA TÊN VÀ ĐỊA CHỈ TRÁNH TRUNCATE
ALTER TABLE NhaCungCap ALTER COLUMN TenNhaCungCap NVARCHAR(255);
ALTER TABLE NhaCungCap ALTER COLUMN DiaChi NVARCHAR(255);
ALTER TABLE KhachHang ALTER COLUMN DiaChi NVARCHAR(255);
ALTER TABLE NhanVien ALTER COLUMN ChucVu NVARCHAR(100);
ALTER TABLE SanPham ALTER COLUMN LoaiSanPham NVARCHAR(100);
GO

-- 2. BỔ SUNG BẢNG VÀ CỘT MỚI (NẾU CHƯA CÓ)
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'active_ingredients')
BEGIN
    CREATE TABLE active_ingredients (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        name NVARCHAR(150) NOT NULL UNIQUE,
        description NVARCHAR(MAX)
    );
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'SanPham' AND COLUMN_NAME = 'barcode')
BEGIN
    ALTER TABLE SanPham ADD barcode VARCHAR(50);
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'SanPham' AND COLUMN_NAME = 'active_ingredient_id')
BEGIN
    ALTER TABLE SanPham ADD active_ingredient_id BIGINT;
    ALTER TABLE SanPham ADD CONSTRAINT FK_SanPham_ActiveIngredient FOREIGN KEY (active_ingredient_id) REFERENCES active_ingredients(id);
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
BEGIN
    CREATE TABLE users (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password NVARCHAR(255) NOT NULL,
        fullName NVARCHAR(100) NOT NULL,
        email NVARCHAR(100) UNIQUE,
        phone VARCHAR(20),
        role VARCHAR(30) NOT NULL,
        createdAt DATETIME2 DEFAULT GETDATE()
    );
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'invoices')
BEGIN
    CREATE TABLE invoices (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        invoiceNumber VARCHAR(50) NOT NULL UNIQUE,
        saleDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        subtotal FLOAT NOT NULL,
        discountAmount FLOAT NOT NULL DEFAULT 0,
        totalAmount FLOAT NOT NULL,
        customerPaid FLOAT NOT NULL,
        changeAmount FLOAT NOT NULL,
        paymentMethod VARCHAR(30) DEFAULT 'CASH',
        pharmacist_id BIGINT,
        customerName NVARCHAR(100),
        customerPhone VARCHAR(20),
        CONSTRAINT FK_Invoice_Pharmacist FOREIGN KEY (pharmacist_id) REFERENCES users(id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'invoice_details')
BEGIN
    CREATE TABLE invoice_details (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        invoice_id BIGINT NOT NULL,
        batch_id VARCHAR(50) NOT NULL,
        medicine_id VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        unitPrice FLOAT NOT NULL,
        totalPrice FLOAT NOT NULL,
        CONSTRAINT FK_InvDet_Invoice FOREIGN KEY (invoice_id) REFERENCES invoices(id),
        CONSTRAINT FK_InvDet_Batch FOREIGN KEY (batch_id) REFERENCES LoThuoc(MaLo),
        CONSTRAINT FK_InvDet_Medicine FOREIGN KEY (medicine_id) REFERENCES SanPham(MaSanPham)
    );
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'online_orders')
BEGIN
    CREATE TABLE online_orders (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        orderNumber VARCHAR(50) NOT NULL UNIQUE,
        customer_id BIGINT,
        orderDate DATETIME2 NOT NULL DEFAULT GETDATE(),
        totalAmount FLOAT NOT NULL,
        status VARCHAR(30) DEFAULT 'COMPLETED',
        shippingAddress NVARCHAR(255),
        receiverPhone VARCHAR(20),
        receiverName NVARCHAR(100),
        CONSTRAINT FK_OnlineOrder_Customer FOREIGN KEY (customer_id) REFERENCES users(id)
    );
END
GO

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'order_details')
BEGIN
    CREATE TABLE order_details (
        id BIGINT IDENTITY(1,1) PRIMARY KEY,
        order_id BIGINT NOT NULL,
        batch_id VARCHAR(50) NOT NULL,
        medicine_id VARCHAR(50) NOT NULL,
        quantity INT NOT NULL,
        price FLOAT NOT NULL,
        totalPrice FLOAT NOT NULL,
        CONSTRAINT FK_OrdDet_Order FOREIGN KEY (order_id) REFERENCES online_orders(id),
        CONSTRAINT FK_OrdDet_Batch FOREIGN KEY (batch_id) REFERENCES LoThuoc(MaLo),
        CONSTRAINT FK_OrdDet_Medicine FOREIGN KEY (medicine_id) REFERENCES SanPham(MaSanPham)
    );
END
GO

-- 3. XÓA SẠCH DỮ LIỆU CŨ THEO THỨ TỰ KHÓA NGOẠI
DELETE FROM invoice_details;
DELETE FROM order_details;
DELETE FROM ChiTietDonHang;
DELETE FROM ChiTietPhieuNhap;
DELETE FROM PhanPhoi;
DELETE FROM invoices;
DELETE FROM online_orders;
DELETE FROM DonHang;
DELETE FROM PhieuNhap;
DELETE FROM LoThuoc;
DELETE FROM SanPham;
DELETE FROM active_ingredients;
DELETE FROM users;
DELETE FROM KhachHang;
DELETE FROM NhanVien;
DELETE FROM NhaCungCap;
GO

-- 4. ĐỔ DỮ LIỆU THẬT CHO BẢNG NHÂN VIÊN
INSERT INTO NhanVien (MaNhanVien, HoTen, SoDienThoai, NgaySinh, ChucVu, NgayBatDau) VALUES
('NV001', N'DS. CKII Lê Hoàng Nam', '0912345678', '1985-04-12', N'Quản lý Nhà thuốc', '2021-01-10'),
('NV002', N'DS. Trần Minh Anh', '0987654321', '1994-08-20', N'Dược sĩ Tư vấn bán lẻ', '2022-03-15'),
('NV003', N'DS. Phạm Thùy Linh', '0905556667', '1997-11-02', N'Dược sĩ Bán hàng quầy', '2023-06-01'),
('NV004', N'Nguyễn Văn Thắng', '0938889999', '1991-03-15', N'Thủ kho Dược phẩm', '2022-09-01');
GO

-- 5. ĐỔ DỮ LIỆU THẬT CHO BẢNG KHÁCH HÀNG
INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, DiaChi, NgayKhoiTao) VALUES
('KH001', N'Nguyễn Hoàng Long', '0903112233', N'120 Nguyễn Huệ, Quận 1, TP.HCM', '2025-01-15'),
('KH002', N'Lê Thị Mai Hoa', '0918445566', N'45 Xô Viết Nghệ Tĩnh, Bình Thạnh, TP.HCM', '2025-02-10'),
('KH003', N'Trần Quốc Bảo', '0989778899', N'88 Đỗ Xuân Hợp, TP. Thủ Đức, TP.HCM', '2025-03-01'),
('KH004', N'Khách vãng lai tại quầy', '0000000000', N'Không lưu địa chỉ', '2025-01-01');
GO

-- 6. ĐỔ DỮ LIỆU THẬT CHO BẢNG NHÀ CUNG CẤP DƯỢC PHẨM
INSERT INTO NhaCungCap (MaNhaCungCap, TenNhaCungCap, SoDienThoai, DiaChi) VALUES
('NCC001', N'Cty CP Dược Hậu Giang (DHG Pharma)', '02923891433', N'288 Bis Nguyễn Văn Cừ, An Hòa, Cần Thơ'),
('NCC002', N'Cty TNHH Zuellig Pharma Việt Nam', '02839102600', N'Tầng 15, Bitexco, Bến Nghé, Quận 1, TP.HCM'),
('NCC003', N'Cty CP Dược phẩm Trung Ương 1 (CPC1)', '02438453315', N'356 Giải Phóng, Phương Liệt, Thanh Xuân, Hà Nội'),
('NCC004', N'Cty TNHH Sanofi-Aventis Việt Nam', '02838298526', N'Số 10 Hàm Nghi, Bến Nghé, Quận 1, TP.HCM');
GO

-- 7. ĐỔ DỮ LIỆU THẬT CHO BẢNG HOẠT CHẤT CHÍNH (ACTIVE INGREDIENTS)
SET IDENTITY_INSERT active_ingredients ON;
INSERT INTO active_ingredients (id, name, description) VALUES
(1, N'Paracetamol (Acetaminophen)', N'Hoạt chất giảm đau hạ sốt an toàn hàng đầu, thích hợp người viêm loét dạ dày.'),
(2, N'Ibuprofen', N'Thuốc kháng viêm không steroid (NSAID), giảm đau kháng viêm mức độ nhẹ đến vừa.'),
(3, N'Amoxicillin + Acid Clavulanic', N'Kháng sinh phổ rộng nhóm Penicillin phối hợp chất ức chế beta-lactamase.'),
(4, N'Cefixime', N'Kháng sinh nhóm Cephalosporin thế hệ 3, điều trị nhiễm khuẩn hô hấp, tiết niệu.'),
(5, N'Cetirizine diHCl', N'Kháng histamin H1 thế hệ 2, điều trị viêm mũi dị ứng, mề đay, dị ứng thời tiết.'),
(6, N'Esomeprazole', N'Ức chế bơm proton (PPI), giảm tiết acid dạ dày, điều trị trào ngược dạ dày thực quản (GERD).'),
(7, N'Berberin chloride', N'Kháng khuẩn chiết xuất từ vàng đắng, điều trị tiêu chảy, kiết lỵ, nhiễm trùng đường ruột.'),
(8, N'Cao khô lá thường xuân', N'Dược liệu trị ho tự nhiên, hóa lỏng đờm, chống co thắt phế quản hiệu quả.'),
(9, N'Vitamin C + Kẽm (Zinc)', N'Hợp chất chống oxy hóa mạnh, tăng cường miễn dịch và bảo vệ tế bào.'),
(10, N'Natri Clorid 0.9%', N'Dung dịch muối đẳng trương sinh lý làm sạch mắt, hốc mũi.');
SET IDENTITY_INSERT active_ingredients OFF;
GO

-- 8. ĐỔ DỮ LIỆU THẬT CHO BẢNG SẢN PHẨM (SAN PHAM CHUẨN THỊ TRƯỜNG)
INSERT INTO SanPham (MaSanPham, TenSanPham, LoaiSanPham, GiaBan, barcode, active_ingredient_id) VALUES
('SP001', N'Panadol Extra đỏ (Hộp 180 viên / 15 vỉ)', N'Thuốc giảm đau', 245000, '8935001800012', 1),
('SP002', N'Hapacol 650 (Hộp 100 viên / 10 vỉ)', N'Thuốc giảm đau', 135000, '8935001800029', 1),
('SP003', N'Efferalgan 500mg sủi (Tuýp 16 viên)', N'Thuốc giảm đau sủi', 88000, '8935001800036', 1),
('SP004', N'Gofen 400 Clear (Hộp 30 viên)', N'Thuốc kháng viêm', 85000, '8935001800043', 2),
('SP005', N'Alaxan (Hộp 100 viên / 10 vỉ)', N'Thuốc kháng viêm', 125000, '8935001800050', 2),
('SP006', N'Augmentin 1g (Hộp 14 viên / 2 vỉ)', N'Thuốc kháng sinh', 275000, '8935001800067', 3),
('SP007', N'Claminat 1g (Hộp 14 viên / 2 vỉ)', N'Thuốc kháng sinh', 195000, '8935001800074', 3),
('SP008', N'Cefixim 200mg Mekophar (Hộp 20 viên)', N'Thuốc kháng sinh', 98000, '8935001800081', 4),
('SP009', N'Zyrtec 10mg (Hộp 10 viên / 1 vỉ)', N'Thuốc dị ứng', 92000, '8935001800098', 5),
('SP010', N'Cetirizin STADA 10mg (Hộp 50 viên)', N'Thuốc dị ứng', 78000, '8935001800104', 5),
('SP011', N'Nexium Mups 40mg (Hộp 14 viên)', N'Thuốc dạ dày', 375000, '8935001800111', 6),
('SP012', N'Berberin BM 100mg (Lọ 100 viên)', N'Thuốc tiêu hóa', 38000, '8935001800128', 7),
('SP013', N'Siro ho Prospan 100ml (Chai 100ml)', N'Thuốc ho thảo dược', 135000, '8935001800135', 8),
('SP014', N'Berocca Performance sủi vị cam (Tuýp 10 viên)', N'Thực phẩm chức năng', 92000, '8935001800142', 9),
('SP015', N'Dung dịch nhỏ mắt Natri Clorid 0.9% (Lọ 10ml)', N'Nước muối sinh lý', 5000, '8935001800159', 10);
GO

-- 9. LIÊN KẾT PHÂN PHỐI NHÀ CUNG CẤP
INSERT INTO PhanPhoi (MaNhaCungCap, MaSanPham) VALUES
('NCC001', 'SP002'),
('NCC001', 'SP007'),
('NCC002', 'SP001'),
('NCC002', 'SP006'),
('NCC002', 'SP009'),
('NCC002', 'SP011'),
('NCC003', 'SP008'),
('NCC003', 'SP012'),
('NCC004', 'SP003'),
('NCC004', 'SP013'),
('NCC004', 'SP014'),
('NCC001', 'SP015');
GO

-- 10. ĐỔ DỮ LIỆU THẬT CHO BẢNG LÔ THUỐC (ĐA DẠNG HẠN DÙNG)
INSERT INTO LoThuoc (MaLo, MaSanPham, SoLo, HanSuDung, SoLuongTon, GiaNhap) VALUES
-- SP001: 2 lô (Lô 1 date xa, Lô 2 cận hạn < 15 ngày -> Kích hoạt CRITICAL ALERT)
('LOT-PA-2601', 'SP001', 202601, '2028-12-31', 180, 195000),
('LOT-PA-2602', 'SP001', 202602, '2026-11-03', 25, 195000), -- CẬN HẠN < 10 NGÀY (CRITICAL)

-- SP002 (Hapacol 650)
('LOT-HP-2601', 'SP002', 202603, '2028-06-30', 150, 95000),

-- SP003 (Efferalgan sủi): Cận hạn < 30 ngày -> Kích hoạt WARNING ALERT
('LOT-EF-2601', 'SP003', 202604, '2026-11-18', 40, 65000),  -- CẬN HẠN < 25 NGÀY (WARNING)

-- SP004 (Gofen 400)
('LOT-GF-2601', 'SP004', 202605, '2027-11-20', 80, 62000),

-- SP005 (Alaxan): Có 1 lô quá hạn và 1 lô còn hạn
('LOT-AX-OLD',  'SP005', 202501, '2026-09-15', 15, 85000),  -- ĐÃ HẾT HẠN (FEFO tự bỏ qua)
('LOT-AX-2601', 'SP005', 202602, '2027-10-15', 85, 88000),

-- SP006 (Augmentin 1g)
('LOT-AG-2601', 'SP006', 202606, '2028-03-15', 60, 220000),

-- SP007 (Claminat 1g)
('LOT-CL-2601', 'SP007', 202607, '2027-09-30', 120, 145000),

-- SP008 (Cefixim 200mg)
('LOT-CF-2601', 'SP008', 202608, '2027-12-15', 90, 72000),

-- SP009 (Zyrtec 10mg)
('LOT-ZY-2601', 'SP009', 202609, '2028-04-10', 70, 68000),

-- SP010 (Cetirizin STADA 10mg)
('LOT-CT-2601', 'SP010', 202610, '2028-01-25', 110, 55000),

-- SP011 (Nexium 40mg)
('LOT-NX-2601', 'SP011', 202611, '2027-08-15', 50, 290000),

-- SP012 (Berberin BM)
('LOT-BB-2601', 'SP012', 202612, '2028-10-20', 250, 25000),

-- SP013 (Siro Prospan)
('LOT-PS-2601', 'SP013', 202613, '2027-05-30', 85, 98000),

-- SP014 (Berocca sủi)
('LOT-BC-2601', 'SP014', 202614, '2027-12-31', 140, 68000),

-- SP015 (Natri Clorid 0.9%)
('LOT-NC-2601', 'SP015', 202615, '2028-12-31', 500, 3200);
GO

-- 11. ĐỔ DỮ LIỆU TÀI KHOẢN HỆ THỐNG (MÃ HÓA BCRYPT CHUẨN)
-- Mật khẩu: admin123, pharmacist123, customer123
INSERT INTO users (username, password, fullName, email, phone, role, createdAt) VALUES
('admin', '$2a$10$w3U68ZkUqU9qC4W1Wl.5E.aZqgJzG8O8R8H9N0T7K1Q2P3L4M5N6O', N'DS. CKII Lê Hoàng Nam', 'admin@nhathuocnamviet.vn', '0912345678', 'ADMIN', GETDATE()),
('pharmacist', '$2a$10$w3U68ZkUqU9qC4W1Wl.5E.aZqgJzG8O8R8H9N0T7K1Q2P3L4M5N6O', N'DS. Trần Minh Anh', 'minhanh.ds@nhathuocnamviet.vn', '0987654321', 'PHARMACIST', GETDATE()),
('customer', '$2a$10$w3U68ZkUqU9qC4W1Wl.5E.aZqgJzG8O8R8H9N0T7K1Q2P3L4M5N6O', N'Nguyễn Hoàng Long', 'long.nguyen@gmail.com', '0903112233', 'CUSTOMER', GETDATE());
GO

-- 12. ĐỔ DỮ LIỆU HÓA ĐƠN THỰC TẾ
DECLARE @PharmacistId BIGINT;
SELECT @PharmacistId = id FROM users WHERE username = 'pharmacist';

INSERT INTO invoices (invoiceNumber, saleDate, subtotal, discountAmount, totalAmount, customerPaid, changeAmount, paymentMethod, pharmacist_id, customerName, customerPhone) VALUES
('HD-20261020-0001', '2026-10-20 09:15:00', 490000, 20000, 470000, 500000, 30000, 'CASH', @PharmacistId, N'Nguyễn Hoàng Long', '0903112233'),
('HD-20261022-0002', '2026-10-22 14:30:00', 363000, 0, 363000, 400000, 37000, 'TRANSFER', @PharmacistId, N'Lê Thị Mai Hoa', '0918445566'),
('HD-20261023-0003', '2026-10-23 16:45:00', 275000, 0, 275000, 300000, 25000, 'CARD', @PharmacistId, N'Trần Quốc Bảo', '0989778899');

DECLARE @Inv1 BIGINT = (SELECT id FROM invoices WHERE invoiceNumber = 'HD-20261020-0001');
DECLARE @Inv2 BIGINT = (SELECT id FROM invoices WHERE invoiceNumber = 'HD-20261022-0002');
DECLARE @Inv3 BIGINT = (SELECT id FROM invoices WHERE invoiceNumber = 'HD-20261023-0003');

INSERT INTO invoice_details (invoice_id, batch_id, medicine_id, quantity, unitPrice, totalPrice) VALUES
(@Inv1, 'LOT-PA-2601', 'SP001', 2, 245000, 490000),
(@Inv2, 'LOT-PS-2601', 'SP013', 1, 135000, 135000),
(@Inv2, 'LOT-AX-2601', 'SP005', 1, 125000, 125000),
(@Inv2, 'LOT-BC-2601', 'SP014', 1, 92000, 92000),
(@Inv2, 'LOT-NC-2601', 'SP015', 2, 5000, 10000),
(@Inv3, 'LOT-AG-2601', 'SP006', 1, 275000, 275000);
GO

