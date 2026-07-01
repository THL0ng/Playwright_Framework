import { test as setup } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

const authFile = path.join(__dirname, '../.auth/storage.json');

setup('authenticate', async ({ page }) => {
  // 1. THÔNG BÁO BẮT ĐẦU
  console.log('\n>>> [AUTH SETUP]: Bắt đầu tiến trình...');

  // 2. CÁC ACTION LOGIN (Điền locator/action của bạn vào đây)
  await page.goto('/login');
  // ... your login actions ...
  
  // 3. ĐỢI TRẠNG THÁI ĐĂNG NHẬP THÀNH CÔNG
  await page.waitForURL('**/dashboard'); 

  // 4. LƯU SESSION (Không sửa dòng này)
  if (!fs.existsSync(path.dirname(authFile))) {
    fs.mkdirSync(path.dirname(authFile), { recursive: true });
  }
  await page.context().storageState({ path: authFile });

  // 5. THÔNG BÁO KẾT THÚC
  console.log('>>> [AUTH SETUP]: Session đã được lưu!');
});