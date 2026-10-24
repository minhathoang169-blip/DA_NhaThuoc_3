import { test, expect } from '@playwright/test';

test.describe('E2E Pharmacy System: Quy trình bán hàng tại quầy (POS Happy Path)', () => {
  const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

  test.beforeEach(async ({ page }) => {
    // Thiết lập viewport tiêu chuẩn màn hình bán hàng quầy POS (Full HD Desktop)
    await page.setViewportSize({ width: 1920, height: 1080 });
  });

  test('Happy Path: Đăng nhập Dược sĩ -> Vào POS -> Tìm thuốc -> Bán FEFO -> Xác minh Hóa đơn & Lô trừ', async ({ page }) => {
    // -------------------------------------------------------------------------
    // BƯỚC 1: ĐĂNG NHẬP DƯỢC SĨ
    // -------------------------------------------------------------------------
    await page.goto(`${BASE_URL}/login`);

    // Kiểm tra các trường đăng nhập hiển thị
    const usernameInput = page.locator('input[name="username"], input[data-testid="login-username"]');
    const passwordInput = page.locator('input[name="password"], input[data-testid="login-password"]');
    const submitBtn = page.locator('button[type="submit"], button[data-testid="login-submit"]');

    await expect(usernameInput).toBeVisible();
    await usernameInput.fill('pharmacist');
    await passwordInput.fill('pharmacist123');
    await submitBtn.click();

    // Xác minh đăng nhập thành công: chuyển hướng vào trang chính hoặc màn hình POS
    await page.waitForURL(/.*(pos|overview|dashboard)/, { timeout: 10000 });

    // -------------------------------------------------------------------------
    // BƯỚC 2: TRUY CẬP MÀN HÌNH BÁN HÀNG TẠI QUẦY (POS)
    // -------------------------------------------------------------------------
    const posNavBtn = page.locator('a[href*="/pos"], button:has-text("Bán hàng"), [data-testid="nav-pos"]');
    if (await posNavBtn.isVisible()) {
      await posNavBtn.click();
    }

    // Xác nhận đã ở giao diện POS
    await expect(page.locator('text=Hóa đơn bán lẻ quầy, [data-testid="checkout-button"]')).toBeVisible();

    // -------------------------------------------------------------------------
    // BƯỚC 3: TÌM KIẾM THUỐC VÀ KIỂM TRA LÔ THUỐC (FEFO PREVIEW)
    // -------------------------------------------------------------------------
    const searchInput = page.locator('input[placeholder*="Tìm kiếm"], input[data-testid="pos-search-input"]');
    await expect(searchInput).toBeVisible();

    // Nhập từ khóa tìm kiếm (Ví dụ: Paracetamol)
    await searchInput.fill('Paracetamol');
    // Đợi 400ms cho Debounce hoàn tất gọi API /api/v1/medicines/search
    await page.waitForTimeout(400);

    // Xác nhận thuốc hiển thị trong danh sách kết quả tìm kiếm
    const medicineCard = page.locator('text=Paracetamol 500mg, [data-testid*="medicine-item-"]').first();
    await expect(medicineCard).toBeVisible();

    // -------------------------------------------------------------------------
    // BƯỚC 4: THÊM THUỐC VÀO GIỎ HÀNG & CHỈNH SỐ LƯỢNG
    // -------------------------------------------------------------------------
    const addToCartBtn = medicineCard.locator('button:has-text("Chọn"), button:has-text("+"), [data-testid*="btn-add-"]');
    await addToCartBtn.click();

    // Kiểm tra sản phẩm đã xuất hiện trong giỏ hàng (cột phải)
    const cartItem = page.locator('[data-testid*="cart-item-"]').first();
    await expect(cartItem).toBeVisible();

    // Tăng số lượng lên 2 hộp
    const increaseBtn = cartItem.locator('[data-testid*="btn-increase-"]');
    await increaseBtn.click();

    // -------------------------------------------------------------------------
    // BƯỚC 5: KIỂM TRA TÍNH TOÁN TIỀN & NHẬP TIỀN KHÁCH ĐƯA
    // -------------------------------------------------------------------------
    // Kiểm tra tổng tiền khác 0
    const finalTotalElement = page.locator('[data-testid="final-total"]');
    await expect(finalTotalElement).toBeVisible();
    const totalText = await finalTotalElement.textContent();
    expect(totalText).not.toBe('0 ₫');

    // Nút "Thanh toán" ban đầu phải DISABLE vì chưa nhập tiền khách đưa
    const checkoutBtn = page.locator('[data-testid="checkout-button"]');
    await expect(checkoutBtn).toBeDisabled();

    // Bấm nút thanh toán nhanh "Đủ tiền" hoặc nhập tiền khách đưa
    const exactPayBtn = page.locator('[data-testid="btn-exact-pay"]');
    if (await exactPayBtn.isVisible()) {
      await exactPayBtn.click();
    } else {
      const paidInput = page.locator('[data-testid="customer-paid-input"]');
      await paidInput.fill('100000');
    }

    // Lúc này nút Thanh toán phải chuyển sang ENABLE
    await expect(checkoutBtn).toBeEnabled();

    // -------------------------------------------------------------------------
    // BƯỚC 6: BẤM NÚT THANH TOÁN & GỌI API POST /api/v1/pos/checkout
    // -------------------------------------------------------------------------
    // Bắt và kiểm tra request mạng POST /api/v1/pos/checkout
    const [response] = await Promise.all([
      page.waitForResponse((res) => res.url().includes('/api/v1/pos/checkout') && res.status() === 200),
      checkoutBtn.click(),
    ]);

    const responseBody = await response.json();
    console.log('Checkout Response Body:', responseBody);

    // Xác thực cấu trúc dữ liệu trả về từ backend Spring Boot
    expect(responseBody.invoiceNumber).toBeTruthy();
    expect(responseBody.allocations.length).toBeGreaterThan(0);

    // -------------------------------------------------------------------------
    // BƯỚC 7: XÁC MINH MODAL HÓA ĐƠN & THÔNG TIN LÔ (FEFO TRACEABILITY)
    // -------------------------------------------------------------------------
    // Hóa đơn thành công hiển thị popup/modal
    const receiptModal = page.locator('text=Thanh toán thành công, [data-testid="receipt-modal"]');
    await expect(receiptModal).toBeVisible({ timeout: 5000 });

    // Xác minh mã hóa đơn trùng khớp
    await expect(page.locator(`text=${responseBody.invoiceNumber}`)).toBeVisible();

    // Xác minh mã Lô thuốc (Batch ID) được hiển thị trên chi tiết hóa đơn
    const allocatedBatchId = responseBody.allocations[0].batchId;
    await expect(page.locator(`text=${allocatedBatchId}`)).toBeVisible();

    // Bấm nút "In hóa đơn / Đóng" để hoàn tất giao dịch
    const printOrCloseBtn = page.locator('button:has-text("Đóng"), button:has-text("In hóa đơn")');
    await printOrCloseBtn.click();

    // Giỏ hàng được làm mới về rỗng, sẵn sàng cho khách tiếp theo
    await expect(page.locator('[data-testid="empty-cart-message"]')).toBeVisible();
  });
});
