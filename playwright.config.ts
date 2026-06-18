import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.staging';
dotenv.config({ path: path.resolve(__dirname, envFile) });

export default defineConfig({
  // Dùng đường dẫn chuẩn hóa
  globalSetup: path.resolve(__dirname, 'src/utils/global/global-setup.ts'),
  globalTeardown: path.resolve(__dirname, 'src/utils/global/global-teardown.ts'),

  testDir: './tests',
  workers: 1, 
  
  use: {
    baseURL: process.env.BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
  
  },

  projects: [
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },
  ],
});