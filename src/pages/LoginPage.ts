// src/pages/LoginPage.ts
import { Page, Locator } from '@playwright/test';

export class LoginPage {
  // 1. Định nghĩa các Locator là thuộc tính của class
  readonly page: Page;
  
  // 2. Constructor nhận vào 'page' và khởi tạo các Locator
  constructor(page: Page) {
    this.page = page;
  }


}