/// <reference types="node" />
import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';
import * as dotenv from 'dotenv';

// 1. Nạp biến môi trường
const envFile = process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env.staging';
dotenv.config({ path: path.resolve(__dirname, envFile) });

if (!process.env.BASE_URL) {
  throw new Error("Missing BASE_URL! Hãy kiểm tra file .env.staging của bạn.");
}

export default defineConfig({
  globalSetup: './src/utils/global-setup-teardown.ts',
  globalTeardown: './src/utils/global-setup-teardown.ts',
  // --------------------

  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,

  reporter: process.env.CI ? [['html'], ['github']] : [['html', { open: 'on-failure' }]],

  timeout: 60000,
  expect: { timeout: 5000 },

  use: {
    baseURL: process.env.BASE_URL,
    actionTimeout: 10000,
    navigationTimeout: 15000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    locale: 'en-US',
    timezoneId: 'Asia/Ho_Chi_Minh',
  },

  projects: [
    {
      name: 'setup',
      testMatch: /.*\.setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
      dependencies: ['setup'],
    },
  ],

  webServer: !process.env.CI ? {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  } : undefined,
});