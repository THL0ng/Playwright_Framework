import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

/**
 * 1. LOGIC LOAD BIẾN MÔI TRƯỜNG
 * Chúng ta ưu tiên biến môi trường có sẵn. 
 * Nếu có NODE_ENV, load file .env tương ứng.
 */
const nodeEnv = process.env.NODE_ENV;
if (nodeEnv) {
  dotenv.config({ path: path.resolve(__dirname, 'envs', `.env.${nodeEnv}`) });
} else {
  // Load file .env mặc định ở thư mục gốc (nếu có)
  dotenv.config();
}

/**
 * 2. KIỂM TRA BẮT BUỘC (Fail-fast)
 * Không cho phép chạy nếu thiếu BASE_URL.
 */
if (!process.env.BASE_URL) {
  throw new Error(
    "LỖI: Biến môi trường 'BASE_URL' chưa được thiết lập. " +
    "Hãy chạy bằng lệnh npm (ví dụ: npm run test:staging) hoặc kiểm tra lại file .env!"
  );
}

export default defineConfig({
  globalSetup: path.resolve(__dirname, 'src/utils/global/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, 'src/utils/global/global-teardown.ts'),

  testDir: './tests',
  workers: process.env.CI ? 1 : 1, 
  
  use: {
    // Lấy giá trị trực tiếp từ biến môi trường
    baseURL: process.env.BASE_URL,
    
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    
    // Tự động thêm httpCredentials chỉ khi cả 2 biến đều tồn tại
    ...(process.env.BASIC_AUTH_USER && process.env.BASIC_AUTH_PASSWORD ? {
      httpCredentials: {
        username: process.env.BASIC_AUTH_USER,
        password: process.env.BASIC_AUTH_PASSWORD,
      }
    } : {})
  },
  
  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { 
          ...devices['Desktop Chrome']
          // Không cần khai báo lại baseURL ở đây, nó đã lấy từ use bên trên
      },
      dependencies: ['setup'],
    },
  ],
});