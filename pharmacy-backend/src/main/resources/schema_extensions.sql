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
