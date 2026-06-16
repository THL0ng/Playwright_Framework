import { FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  console.log('\n--- [GLOBAL SETUP]: BẮT ĐẦU ---');
  
  // Tự động tìm đến folder playwright/.auth bất kể bạn đang ở đâu
  const authFilePath = path.resolve(process.cwd(), 'playwright', '.auth', 'chromium.json');

  if (fs.existsSync(authFilePath)) {
    fs.unlinkSync(authFilePath);
    console.log(`-> Đã xóa session cũ tại: ${authFilePath}`);
  } else {
    console.log('-> Không tìm thấy session cũ, bỏ qua xóa.');
  }
  
  console.log('--- [GLOBAL SETUP]: HOÀN TẤT ---\n');
}

async function globalTeardown(config: FullConfig) {
  console.log('\n--- [GLOBAL TEARDOWN]: ĐÃ XONG ---');
}

export { globalSetup, globalTeardown };