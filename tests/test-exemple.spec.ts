import { test, expect } from '@playwright/test';

test('Kiểm tra mở trình duyệt và truy cập trang chủ', async ({ page }) => {
  // 1. Điều hướng tới BASE_URL đã cấu hình trong .env.staging
  await page.goto('/');

  // 2. In ra tiêu đề trang để xác nhận browser đã mở thành công
  const title = await page.title();
  console.log('Tiêu đề trang hiện tại là:', title);

  // 3. Kiểm tra cơ bản: đảm bảo trang web đã load (ví dụ: URL không trống)
  await expect(page).toHaveURL(/.*\//);
  
  console.log('Browser đã mở và truy cập trang thành công!');
});