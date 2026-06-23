import { FullConfig } from '@playwright/test';

export default async function globalTeardown(config: FullConfig) {
  console.log('\n--- [GLOBAL SETUP]: ĐÃ XONG ---');
}   