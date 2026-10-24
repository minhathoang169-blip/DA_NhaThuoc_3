import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PosCheckoutPanel, CartItem } from '../components/PosCheckoutPanel';

describe('PosCheckoutPanel Component Tests', () => {
  const mockItems: CartItem[] = [
    { id: 'SP001', name: 'Paracetamol 500mg', price: 2000, quantity: 5, allocatedBatchId: 'LOT01' },
    { id: 'SP002', name: 'Panadol Extra', price: 5000, quantity: 2, allocatedBatchId: 'LOT02' },
  ];

  const defaultProps = {
    items: mockItems,
    onUpdateQuantity: jest.fn(),
    onRemoveItem: jest.fn(),
    onCheckout: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('1. Tính đúng tiền hàng (Subtotal) cho các sản phẩm trong giỏ', () => {
    // 5 * 2000 + 2 * 5000 = 10,000 + 10,000 = 20,000 VNĐ
    render(<PosCheckoutPanel {...defaultProps} />);

    const subtotalElement = screen.getByTestId('subtotal-amount');
    expect(subtotalElement.textContent).toContain('20.000');
  });

  test('2. Áp dụng chiết khấu phần trăm (%) chính xác', () => {
    render(<PosCheckoutPanel {...defaultProps} />);

    // Đổi kiểu chiết khấu sang percent
    const select = screen.getByTestId('discount-type-select');
    fireEvent.change(select, { target: { value: 'percent' } });

    // Nhập giảm 10%
    const input = screen.getByTestId('discount-input');
    fireEvent.change(input, { target: { value: '10' } });

    // Tiền giảm: 20,000 * 10% = 2,000 VNĐ -> Cần trả: 18,000 VNĐ
    const finalTotal = screen.getByTestId('final-total');
    expect(finalTotal.textContent).toContain('18.000');
  });

  test('3. Áp dụng chiết khấu tiền mặt (VNĐ) chính xác', () => {
    render(<PosCheckoutPanel {...defaultProps} />);

    // Nhập giảm 5,000 VNĐ tiền mặt
    const input = screen.getByTestId('discount-input');
    fireEvent.change(input, { target: { value: '5000' } });

    // Cần trả: 20,000 - 5,000 = 15,000 VNĐ
    const finalTotal = screen.getByTestId('final-total');
    expect(finalTotal.textContent).toContain('15.000');
  });

  test('4. Tự động tính tiền thối/tiền thừa chính xác khi khách đưa dư tiền', () => {
    render(<PosCheckoutPanel {...defaultProps} />);

    // Khách đưa 50,000 VNĐ cho đơn hàng 20,000 VNĐ
    const paidInput = screen.getByTestId('customer-paid-input');
    fireEvent.change(paidInput, { target: { value: '50000' } });

    // Tiền thối: 50,000 - 20,000 = 30,000 VNĐ
    const changeAmount = screen.getByTestId('change-amount');
    expect(changeAmount.textContent).toContain('30.000');
  });

  test('5. Nút "Thanh toán" bị DISABLE khi tiền khách đưa thiếu', () => {
    render(<PosCheckoutPanel {...defaultProps} />);

    // Khách đưa 10,000 VNĐ trong khi đơn hàng là 20,000 VNĐ
    const paidInput = screen.getByTestId('customer-paid-input');
    fireEvent.change(paidInput, { target: { value: '10000' } });

    // Nút thanh toán bị disable
    const checkoutBtn = screen.getByTestId('checkout-button');
    expect(checkoutBtn).toBeDisabled();

    // Hiển thị cảnh báo thiếu tiền
    expect(screen.getByTestId('insufficient-cash-warning')).toBeInTheDocument();
  });

  test('6. Nút "Thanh toán" ENABLE khi khách đưa đủ tiền và kích hoạt gọi onCheckout', () => {
    render(<PosCheckoutPanel {...defaultProps} />);

    // Bấm nút "Đủ tiền"
    const exactPayBtn = screen.getByTestId('btn-exact-pay');
    fireEvent.click(exactPayBtn);

    const checkoutBtn = screen.getByTestId('checkout-button');
    expect(checkoutBtn).not.toBeDisabled();

    // Kích hoạt thanh toán
    fireEvent.click(checkoutBtn);
    expect(defaultProps.onCheckout).toHaveBeenCalledTimes(1);
    expect(defaultProps.onCheckout).toHaveBeenCalledWith(
      expect.objectContaining({
        finalTotal: 20000,
        customerPaid: 20000,
        changeAmount: 0,
      })
    );
  });

  test('7. Giỏ hàng rỗng thì nút Thanh toán bị DISABLE', () => {
    render(<PosCheckoutPanel {...defaultProps} items={[]} />);
    expect(screen.getByTestId('checkout-button')).toBeDisabled();
    expect(screen.getByTestId('empty-cart-message')).toBeInTheDocument();
  });
});
