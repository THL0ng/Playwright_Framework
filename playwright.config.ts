import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 1. Load biến môi trường
const nodeEnv = process.env.NODE_ENV || 'staging'; // Mặc định là staging nếu không set
dotenv.config({ path: path.resolve(__dirname, 'src', '.envs', `.env.${nodeEnv}`) });

if (!process.env.BASE_URL) {
  throw new Error("LỖI: Biến môi trường 'BASE_URL' chưa được thiết lập.");
}

export default defineConfig({
  testDir: './tests',
  workers: process.env.CI ? 1 : 1,

  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  },

  projects: [
    // Project Setup: Chạy độc lập để lấy storageState
    { 
      name: 'setup', 
      testMatch: /auth\.setup\.ts/,
      use: {
        ...devices['Desktop Chrome'],
        headless: false, // Để bạn nhìn thấy quá trình login khi debug
      }
    },

    // Project Test: Phụ thuộc vào setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Nạp file storageState đã tạo từ project 'setup'
        storageState: '.auth/storage.json',
      },
      dependencies: ['setup'], // Kích hoạt setup trước khi test chạy
    },
  ],
});