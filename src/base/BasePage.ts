import { Page, Locator, expect, test } from '@playwright/test';
import { CONFIG } from '@constants/config'; // Import từ file hằng số

export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }


    protected async click(locator: Locator, stepName: string): Promise<void> {
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

    protected async fillField(locator: Locator, value: string, fieldName: string): Promise<void> {
        const logPrefix = `[Action] ${fieldName}:`;
    
        try {
            console.log(`${logPrefix} Đang chuẩn bị điền "${value}"...`);
            
            // 1. Chờ element sẵn sàng
            await locator.waitFor({ state: 'visible' });
    
            // 2. Clear và fill.
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


    protected async setCheckbox(locator: Locator, isChecked: boolean, fieldName: string): Promise<void> {
        const logPrefix = `[Action] ${fieldName}:`;
        
        // 1. Chờ element hiển thị (Đảm bảo không bị timeout do UI chưa kịp load)
        await locator.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUTS.UI_ACTION });
    
        // 2. Lấy trạng thái hiện tại
        const currentState = await locator.isChecked();
    
        // 3. Logic xử lý: Chỉ thao tác khi trạng thái hiện tại khác với mong đợi
        if (currentState !== isChecked) {
            console.log(`${logPrefix} Đang thực hiện ${isChecked ? 'Check' : 'Uncheck'}...`);
            await (isChecked ? locator.check() : locator.uncheck());
        } else {
            console.log(`${logPrefix} Đã ở trạng thái mong muốn (${isChecked ? 'Checked' : 'Unchecked'}). Bỏ qua.`);
        }
    
        // 4. Verify trạng thái sau khi thao tác
        try {
            await expect(locator).toBeChecked({ checked: isChecked, timeout: CONFIG.TIMEOUTS.UI_ACTION });
            console.log(`${logPrefix} Đã thiết lập thành công.`);
        } catch (error) {
            console.error(`${logPrefix} [LỖI] Trạng thái không khớp sau khi thao tác.`);
            throw error;
        }
    }

    protected async selectRandomDropdown(locator: Locator, fieldName: string, hasPlaceholder: boolean = true): Promise<void> {
        const logPrefix = `[Action] ${fieldName}:`;
        
        try {
            await locator.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUTS.UI_ACTION });
    
            // 1. Lấy danh sách option an toàn
            const options = locator.locator('option');
            const count = await options.count();
            
            if (count <= (hasPlaceholder ? 1 : 0)) {
                throw new Error(`Dropdown "${fieldName}" không có đủ tùy chọn để chọn ngẫu nhiên.`);
            }
    
            // 2. Logic chọn ngẫu nhiên
            const startIndex = hasPlaceholder ? 1 : 0;
            const randomIndex = Math.floor(Math.random() * (count - startIndex)) + startIndex;
            
            // 3. Lấy giá trị an toàn (ưu tiên value, nếu không có lấy text)
            const selectedOption = options.nth(randomIndex);
            const value = await selectedOption.getAttribute('value') || await selectedOption.innerText();
            
            console.log(`${logPrefix} Đang chọn ngẫu nhiên: "${value}"`);
            
            await locator.selectOption(value!);
            
            // 4. Verify với logic so sánh mềm dẻo hơn
            await expect(locator).toHaveValue(value!, { timeout: CONFIG.TIMEOUTS.UI_ACTION });
            
            console.log(`${logPrefix} Chọn thành công.`);
        } catch (error) {
            console.error(`${logPrefix} [LỖI] ${error instanceof Error ? error.message : 'Không xác định'}`);
            throw error;
        }
    }


    protected async selectRandomCustomDropdown(
        triggerLocator: Locator,
        listLocator: Locator,
        optionLocator: Locator,
        fieldName: string
    ): Promise<void> {
        const logPrefix = `[Action] ${fieldName}:`;
    
        try {
            await triggerLocator.click();
            await listLocator.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUTS.UI_ACTION });
    
            // CẢI TIẾN: Chỉ lọc các option khả dụng (không bị disabled)
            // Giả sử các option disabled có class 'is-disabled' hoặc attribute 'aria-disabled'
            const activeOptions = optionLocator.filter({ has: this.page.locator(':not([disabled])') });
            const count = await activeOptions.count();
    
            if (count === 0) {
                throw new Error(`Không tìm thấy option khả dụng nào cho ${fieldName}`);
            }
    
            const randomIndex = Math.floor(Math.random() * count);
            const randomOption = activeOptions.nth(randomIndex);
            
            const text = (await randomOption.innerText()).trim();
            console.log(`${logPrefix} Đang chọn ngẫu nhiên: "${text}"`);
            
            await randomOption.click();
    
            // Đảm bảo dropdown đóng sau khi chọn
            await expect(listLocator).toBeHidden({ timeout: CONFIG.TIMEOUTS.UI_ACTION });
            
            console.log(`${logPrefix} Đã chọn thành công "${text}".`);
        } catch (error) {
            console.error(`${logPrefix} [LỖI] ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
            throw error;
        }
    }




}