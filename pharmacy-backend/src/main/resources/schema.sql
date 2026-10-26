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
