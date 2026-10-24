import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { ExpiringAlertBadge, ExpiringBatchItem } from '../components/ExpiringAlertBadge';

describe('ExpiringAlertBadge Component Tests', () => {
  test('1. Hiển thị trạng thái an toàn khi không có lô nào cận hạn (0 lô)', () => {
    render(<ExpiringAlertBadge expiringBatches={[]} />);

    expect(screen.getByTestId('badge-normal')).toBeInTheDocument();
    expect(screen.getByText(/Date an toàn/i)).toBeInTheDocument();
  });

  test('2. Hiển thị badge CẢNH BÁO màu vàng khi các lô cận hạn từ 16 đến 30 ngày', () => {
    const warningBatches: ExpiringBatchItem[] = [
      {
        batchId: 'LOT_W1',
        batchNumber: 202611,
        medicineName: 'Vitamin C Enervon',
        quantity: 50,
        expiryDate: '2026-11-20',
        daysRemaining: 25,
        alertLevel: 'WARNING',
      },
    ];

    render(<ExpiringAlertBadge expiringBatches={warningBatches} />);

    const badge = screen.getByTestId('expiring-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-amber-100'); // Màu vàng

    const label = screen.getByTestId('badge-label');
    expect(label.textContent).toContain('<30 ngày');

    const count = screen.getByTestId('badge-count');
    expect(count.textContent).toBe('1');
  });

  test('3. Hiển thị badge KHẨN CẤP màu đỏ và hiệu ứng pulse khi có lô cận hạn <= 15 ngày', () => {
    const criticalBatches: ExpiringBatchItem[] = [
      {
        batchId: 'LOT_C1',
        batchNumber: 202612,
        medicineName: 'Kháng sinh Amoxicillin',
        quantity: 12,
        expiryDate: '2026-11-01',
        daysRemaining: 8, // < 15 ngày!
        alertLevel: 'CRITICAL',
      },
      {
        batchId: 'LOT_W2',
        batchNumber: 202613,
        medicineName: 'Paracetamol',
        quantity: 20,
        expiryDate: '2026-11-20',
        daysRemaining: 27,
        alertLevel: 'WARNING',
      },
    ];

    render(<ExpiringAlertBadge expiringBatches={criticalBatches} />);

    const badge = screen.getByTestId('expiring-badge');
    expect(badge).toBeInTheDocument();
    expect(badge.className).toContain('bg-red-100'); // Màu đỏ khẩn cấp
    expect(badge.className).toContain('animate-pulse');

    const label = screen.getByTestId('badge-label');
    expect(label.textContent).toContain('<15 ngày');

    const count = screen.getByTestId('badge-count');
    expect(count.textContent).toBe('2');
  });

  test('4. Kích hoạt sự kiện onClick khi người dùng click vào Badge', () => {
    const handleClick = jest.fn();
    const batches: ExpiringBatchItem[] = [
      {
        batchId: 'LOT_C1',
        batchNumber: 202612,
        medicineName: 'Thuốc ho',
        quantity: 5,
        expiryDate: '2026-11-01',
        daysRemaining: 7,
        alertLevel: 'CRITICAL',
      },
    ];

    render(<ExpiringAlertBadge expiringBatches={batches} onClick={handleClick} />);

    fireEvent.click(screen.getByTestId('expiring-badge'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
