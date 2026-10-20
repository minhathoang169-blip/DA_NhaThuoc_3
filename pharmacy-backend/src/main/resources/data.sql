-- =========================================================
-- DATABASE: QUAN LY NHA THUOC (CHUAN THEO SO DO ERD)
-- THEO DOI LO THUOC, KHO HANG VA DON HANG CHITIET
-- =========================================================

CREATE DATABASE QuanLyNhaThuocDB;
GO

USE QuanLyNhaThuocDB;
GO

-- 1. BANG NHAN VIEN
CREATE TABLE NhanVien (
    MaNhanVien VARCHAR(50) PRIMARY KEY,
    HoTen NVARCHAR(50) NOT NULL,
    SoDienThoai VARCHAR(20), -- Chuyen sang VARCHAR de tranh loi tran so cua INT khi nhap so 09...
    NgaySinh DATE,
    ChucVu NVARCHAR(50),
    NgayBatDau DATE
);
GO

-- 2. BANG KHACH HANG
CREATE TABLE KhachHang (
    MaKhachHang VARCHAR(50) PRIMARY KEY,
    HoTen NVARCHAR(50) NOT NULL,
    SoDienThoai VARCHAR(20),
    DiaChi NVARCHAR(50),
    NgayKhoiTao DATE DEFAULT GETDATE()
);
GO

-- 3. BANG SAN PHAM
CREATE TABLE SanPham (
    MaSanPham VARCHAR(50) PRIMARY KEY,
    TenSanPham NVARCHAR(255) NOT NULL,
    LoaiSanPham NVARCHAR(20),
    GiaBan DOUBLE PRECISION NOT NULL DEFAULT 0 -- Dung kiểu dữ liệu DOUBLE PRECISION/FLOAT tuong duong vo'i double(10) trong ERD
);
GO

-- 4. BANG NHA CUNG CAP
CREATE TABLE NhaCungCap (
    MaNhaCungCap VARCHAR(50) PRIMARY KEY,
    TenNhaCungCap NVARCHAR(50) NOT NULL,
    SoDienThoai VARCHAR(20),
    DiaChi NVARCHAR(50)
);
GO

-- 5. BANG PHAN PHOI (Quan he giua NhaCungCap va SanPham)
CREATE TABLE PhanPhoi (
    MaNhaCungCap VARCHAR(50),
    MaSanPham VARCHAR(50),
    CONSTRAINT PK_PhanPhoi PRIMARY KEY (MaNhaCungCap, MaSanPham),
    CONSTRAINT FK_PhanPhoi_NhaCungCap FOREIGN KEY (MaNhaCungCap) REFERENCES NhaCungCap(MaNhaCungCap),
    CONSTRAINT FK_PhanPhoi_SanPham FOREIGN KEY (MaSanPham) REFERENCES SanPham(MaSanPham)
);
GO

-- 6. BANG LO THUOC
CREATE TABLE LoThuoc (
    MaLo VARCHAR(50) PRIMARY KEY,
    MaSanPham VARCHAR(50) NOT NULL,
    SoLo INT NOT NULL,
    HanSuDung DATE NOT NULL,
    SoLuongTon INT NOT NULL DEFAULT 0,
    GiaNhap DOUBLE PRECISION NOT NULL DEFAULT 0,
    CONSTRAINT FK_LoThuoc_SanPham FOREIGN KEY (MaSanPham) REFERENCES SanPham(MaSanPham),
    CONSTRAINT CK_LoThuoc_SLTon CHECK (SoLuongTon >= 0),
    CONSTRAINT CK_LoThuoc_GiaNhap CHECK (GiaNhap >= 0)
);
GO

-- 7. BANG PHIEU NHAP
CREATE TABLE PhieuNhap (
    MaPhieuNhap VARCHAR(50) PRIMARY KEY,
    MaNhaCungCap VARCHAR(50) NOT NULL,
    MaNhanVien VARCHAR(50) NOT NULL,
    NgayGiaoDich DATE NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_PhieuNhap_NhaCungCap FOREIGN KEY (MaNhaCungCap) REFERENCES NhaCungCap(MaNhaCungCap),
    CONSTRAINT FK_PhieuNhap_NhanVien FOREIGN KEY (MaNhanVien) REFERENCES NhanVien(MaNhanVien)
);
GO

-- 8. BANG CHI TIET PHIEU NHAP
CREATE TABLE ChiTietPhieuNhap (
    MaPhieuNhap VARCHAR(50),
    MaLo VARCHAR(50),
    SoLuong INT NOT NULL,
    DonGia DOUBLE PRECISION NOT NULL,
    CONSTRAINT PK_ChiTietPhieuNhap PRIMARY KEY (MaPhieuNhap, MaLo),
    CONSTRAINT FK_CTPN_PhieuNhap FOREIGN KEY (MaPhieuNhap) REFERENCES PhieuNhap(MaPhieuNhap),
    CONSTRAINT FK_CTPN_LoThuoc FOREIGN KEY (MaLo) REFERENCES LoThuoc(MaLo),
    CONSTRAINT CK_CTPN_SoLuong CHECK (SoLuong > 0),
    CONSTRAINT CK_CTPN_DonGia CHECK (DonGia >= 0)
);
GO

-- 9. BANG DON HANG
CREATE TABLE DonHang (
    MaDonHang VARCHAR(50) PRIMARY KEY,
    MaKhachHang VARCHAR(50),
    MaNhanVien VARCHAR(50) NOT NULL,
    NgayGiaoDich DATE NOT NULL DEFAULT GETDATE(),
    CONSTRAINT FK_DonHang_KhachHang FOREIGN KEY (MaKhachHang) REFERENCES KhachHang(MaKhachHang),
    CONSTRAINT FK_DonHang_NhanVien FOREIGN KEY (MaNhanVien) REFERENCES NhanVien(MaNhanVien)
);
GO

-- 10. BANG CHI TIET DON HANG
CREATE TABLE ChiTietDonHang (
    MaDonHang VARCHAR(50),
    MaLo VARCHAR(50),
    SoLuong INT NOT NULL,
    DonGia DOUBLE PRECISION NOT NULL,
    CONSTRAINT PK_ChiTietDonHang PRIMARY KEY (MaDonHang, MaLo),
    CONSTRAINT FK_CTDH_DonHang FOREIGN KEY (MaDonHang) REFERENCES DonHang(MaDonHang),
    CONSTRAINT FK_CTDH_LoThuoc FOREIGN KEY (MaLo) REFERENCES LoThuoc(MaLo),
    CONSTRAINT CK_CTDH_SoLuong CHECK (SoLuong > 0),
    CONSTRAINT CK_CTDH_DonGia CHECK (DonGia >= 0)
);
GO

-- =========================================================
-- TAO INDEX CO DIEN DE TOI UU HOA CAC HANH DONG JOIN
-- =========================================================
CREATE NONCLUSTERED INDEX IX_LoThuoc_SanPham ON LoThuoc(MaSanPham);
CREATE NONCLUSTERED INDEX IX_CTDH_LoThuoc ON ChiTietDonHang(MaLo);
CREATE NONCLUSTERED INDEX IX_CTPN_LoThuoc ON ChiTietPhieuNhap(MaLo);
GO

-- =========================================================
-- A. THÊM CỘT TÍNH TỔNG TIỀN TỰ ĐỘNG CHO CHI TIẾT (COMPUTED COLUMNS)
-- (Đáp ứng yêu cầu: "Tính tổng tiền tự động dựa vào số lượng và đơn giá")
-- =========================================================
ALTER TABLE ChiTietPhieuNhap ADD TongTien AS (SoLuong * DonGia);
ALTER TABLE ChiTietDonHang ADD TongTien AS (SoLuong * DonGia);
GO


-- =========================================================
-- B. THÊM TRIGGER TỰ ĐỘNG CẬP NHẬT KHO VÀ CHỐNG XUẤT ÂM KHO
-- =========================================================

-- 1. Trigger tự động CỘNG KHO khi NHẬP HÀNG
CREATE TRIGGER trg_AutoUpdateStock_Import
ON ChiTietPhieuNhap
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE LoThuoc
    SET SoLuongTon = SoLuongTon + i.SoLuong
    FROM LoThuoc lt
    INNER JOIN inserted i ON lt.MaLo = i.MaLo;
END;
GO

-- 2. Trigger tự động TRỪ KHO khi BÁN HÀNG & CHỐNG BÁN QUÁ SỐ LƯỢNG TỒN
CREATE TRIGGER trg_AutoUpdateStock_Sale
ON ChiTietDonHang
AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;

    -- Kiểm tra xem có lô nào bị bán quá số lượng tồn hay không
    IF EXISTS (
        SELECT 1 
        FROM LoThuoc lt
        INNER JOIN inserted i ON lt.MaLo = i.MaLo
        WHERE lt.SoLuongTon < i.SoLuong
    )
    BEGIN
        RAISERROR (N'Lỗi: Số lượng thuốc tồn kho trong lô không đủ để bán!', 16, 1);
        ROLLBACK TRANSACTION;
        RETURN;
    END

    -- Nếu đủ hàng, tiến hành trừ kho
    UPDATE LoThuoc
    SET SoLuongTon = SoLuongTon - i.SoLuong
    FROM LoThuoc lt
    INNER JOIN inserted i ON lt.MaLo = i.MaLo;
END;
GO


-- =========================================================
-- C. BỘ DỮ LIỆU MẪU ĐẦY ĐỦ (DATA SAMPLE) ĐỂ CHẠY THỬ NGHIỆM
-- =========================================================

-- 1. Dữ liệu mẫu bảng Nhân Viên
INSERT INTO NhanVien (MaNhanVien, HoTen, SoDienThoai, NgaySinh, ChucVu, NgayBatDau) VALUES
('NV001', N'Nguyễn Văn Trưởng', '0912345678', '1990-05-12', N'Quản lý', '2022-01-15'),
('NV002', N'Trần Thị Dược Sĩ', '0987654321', '1995-08-20', N'Nhân viên bán thuốc', '2023-03-01'),
('NV003', N'Lê Hoàng Kho', '0905556667', '1993-11-02', N'Nhân viên kho', '2024-06-10');

-- 2. Dữ liệu mẫu bảng Khách Hàng
INSERT INTO KhachHang (MaKhachHang, HoTen, SoDienThoai, DiaChi, NgayKhoiTao) VALUES
('KH001', N'Phạm Minh Tuấn', '0933444555', N'Thủ Đức, TP.HCM', '2025-01-10'),
('KH002', N'Hoàng Lệ Thu', '0944555666', N'Quận 9, TP.HCM', '2025-02-14'),
('KH003', N'Khách Vãng Lai', '0000000000', N'Không có', '2025-01-01');

-- 3. Dữ liệu mẫu bảng Sản Phẩm (Thuốc và thực phẩm chức năng)
INSERT INTO SanPham (MaSanPham, TenSanPham, LoaiSanPham, GiaBan) VALUES
('SP001', N'Thuốc hạ sốt Paracetamol 500mg', N'Thuốc giảm đau', 2000),
('SP002', N'Thuốc kháng sinh Amoxicillin 500mg', N'Thuốc kháng sinh', 5000),
('SP003', N'Vitamin C tăng sức đề kháng Enervon', N'Thực phẩm chức năng', 3500),
('SP004', N'Siro ho bổ phế Bảo Thanh', N'Thuốc ho', 35000);

-- 4. Dữ liệu mẫu bảng Nhà Cung Cấp
INSERT INTO NhaCungCap (MaNhaCungCap, TenNhaCungCap, SoDienThoai, DiaChi) VALUES
('NCC001', N'Công ty Dược phẩm Trung Ương 1', '0243123456', N'Quận Hoàn Kiếm, Hà Nội'),
('NCC002', N'Dược Hậu Giang (DHG Pharma)', '02923891433', N'Quận Bình Thủy, Cần Thơ');

-- 5. Dữ liệu mẫu bảng Phân Phối (Liên kết NCC cung cấp sản phẩm nào)
INSERT INTO PhanPhoi (MaNhaCungCap, MaSanPham) VALUES
('NCC001', 'SP001'),
('NCC001', 'SP002'),
('NCC002', 'SP003'),
('NCC002', 'SP004');

-- 6. Dữ liệu mẫu bảng Lô Thuốc (Ban đầu khởi tạo có số lượng tồn = 0)
INSERT INTO LoThuoc (MaLo, MaSanPham, SoLo, HanSuDung, SoLuongTon, GiaNhap) VALUES
('LOT001', 'SP001', 202601, '2028-12-31', 0, 1200),
('LOT002', 'SP002', 202602, '2027-06-30', 0, 3500),
('LOT003', 'SP003', 202603, '2028-03-15', 0, 2200),
('LOT004', 'SP004', 202604, '2026-11-20', 0, 25000); -- Lô này cố tình cho hạn gần để test báo cáo thuốc gần hết hạn

-- 7. Dữ liệu mẫu bảng Phiếu Nhập Hàng
INSERT INTO PhieuNhap (MaPhieuNhap, MaNhaCungCap, MaNhanVien, NgayGiaoDich) VALUES
('PN001', 'NCC001', 'NV003', '2026-01-20'),
('PN002', 'NCC002', 'NV003', '2026-02-15');

-- 8. Dữ liệu mẫu bảng Chi Tiết Phiếu Nhập
-- (Khi chạy lệnh INSERT này, Trigger 1 phía trên sẽ tự động cộng tồn kho vào bảng LoThuoc)
INSERT INTO ChiTietPhieuNhap (MaPhieuNhap, MaLo, SoLuong, DonGia) VALUES
('PN001', 'LOT001', 1000, 1200), -- Nhập 1000 viên Paracetamol
('PN001', 'LOT002', 500, 3500),  -- Nhập 500 viên Amoxicillin
('PN002', 'LOT003', 300, 2200),  -- Nhập 300 viên Vitamin C
('PN002', 'LOT004', 50, 25000);  -- Nhập 50 chai Siro Bảo Thanh

-- 9. Dữ liệu mẫu bảng Đơn Hàng (Bán lẻ)
INSERT INTO DonHang (MaDonHang, MaKhachHang, MaNhanVien, NgayGiaoDich) VALUES
('HD001', 'KH001', 'NV002', '2026-03-01'),
('HD002', 'KH002', 'NV002', '2026-03-02'),
('HD003', 'KH003', 'NV002', '2026-03-02');

-- 10. Dữ liệu mẫu bảng Chi Tiết Đơn Hàng
-- (Khi chạy lệnh INSERT này, Trigger 2 sẽ kiểm tra hàng và tự động trừ tồn kho ở bảng LoThuoc)
INSERT INTO ChiTietDonHang (MaDonHang, MaLo, SoLuong, DonGia) VALUES
('HD001', 'LOT001', 10, 2000),  -- Khách Tuấn mua 10 viên hạ sốt
('HD001', 'LOT003', 2, 3500),   -- Khách Tuấn mua 2 vỉ Vitamin C
('HD002', 'LOT004', 1, 35000),  -- Khách Thu mua 1 chai Siro ho
('HD003', 'LOT002', 20, 5000);  -- Khách vãng lai mua 20 viên kháng sinh
GO