import { Page, Locator, expect, test } from '@playwright/test';
import { CONFIG } from '@constants/config'; // Import từ file hằng số

export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }


    async click(locator: Locator, stepName: string): Promise<void> {
        await test.step(`Thực hiện click vào: ${stepName}`, async () => {
            try {
                await expect(locator).toBeVisible({ timeout: 5000 });

                await locator.click();

                console.log(`[SUCCESS] Click: ${stepName}`);
            } catch (error) {

                const screenshot = await this.page.screenshot();
                await test.info().attach(`Error_${stepName}`, { body: screenshot, contentType: "image/png" });

                throw error;
            }
        });
    }

    async fillField(locator: Locator, value: string, fieldName: string): Promise<void> {
        const logPrefix = `[Action] ${fieldName}:`;
    
        try {
            console.log(`${logPrefix} Đang chuẩn bị điền "${value}"...`);
            
            // 1. Chờ element sẵn sàng
            await locator.waitFor({ state: 'visible' });
    
            // 2. Clear và fill
            await locator.clear();
            await locator.fill(value);
    
            // 3. Sử dụng expect để verify
            // Lưu ý: Đảm bảo CONFIG.DEFAULT_TIMEOUT đã được định nghĩa
            await expect(locator).toHaveValue(value, { timeout: CONFIG.DEFAULT_TIMEOUT });
            
            console.log(`${logPrefix} Đã điền thành công.`);
            
        } catch (error) {
            console.error(`${logPrefix} [LỖI] Không thể điền dữ liệu "${value}".`);
            // Bắt buộc ném lại error để Playwright biết test case này đã fail
            throw error;
        }
    }




}