import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage'; // Import the page object you want to use
// 1. Định nghĩa các fixture bạn sẽ dùng
type MyFixtures = {
  loginPage: LoginPage;
};  

// 2. Mở rộng test của Playwright
export const test = base.extend<MyFixtures>({
  // Tự động khởi tạo loginPage khi được gọi trong test 
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));  },
});

// 3. Export lại expect để dùng đồng bộ
export { expect } from '@playwright/test';