import { Page, Locator, expect, test } from '@playwright/test';
import { CONFIG } from '@constants/config';

/**
 * BasePage — Template framework cho tất cả Page Objects.
 *
 * Nguyên tắc thiết kế:
 * - Mọi action đều wrap trong test.step() → hiển thị đầy đủ trong Playwright HTML report
 * - Mọi catch block đều attach screenshot → dễ debug khi fail
 * - Timeout thống nhất qua CONFIG.TIMEOUTS.UI_ACTION
 * - Tất cả method là protected → chỉ dùng được trong subclass
 */
export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    // ─────────────────────────────────────────────
    // PRIVATE HELPERS
    // ─────────────────────────────────────────────

    /**
     * Chụp screenshot và đính kèm vào Playwright report khi có lỗi.
     * Dùng chung cho tất cả catch block.
     */
    private async attachErrorScreenshot(stepName: string): Promise<void> {
        try {
            const screenshot = await this.page.screenshot({ fullPage: true });
            await test.info().attach(`[ERROR] ${stepName}`, {
                body: screenshot,
                contentType: 'image/png',
            });
        } catch {
            // Không throw nếu chụp screenshot thất bại — giữ nguyên lỗi gốc
            console.warn(`[WARN] Không thể chụp screenshot cho step: ${stepName}`);
        }
    }

    // ─────────────────────────────────────────────
    // NAVIGATION
    // ─────────────────────────────────────────────

    /**
     * Điều hướng tới URL và chờ page load xong.
     */
    protected async navigate(url: string): Promise<void> {
        await test.step(`Điều hướng tới: ${url}`, async () => {
            try {
                await this.page.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: CONFIG.TIMEOUTS.NAVIGATION,
                });
                console.log(`[SUCCESS] Đã điều hướng tới: ${url}`);
            } catch (error) {
                await this.attachErrorScreenshot(`navigate: ${url}`);
                throw error;
            }
        });
    }

    /**
     * Chờ page load hoàn toàn (dùng sau các action trigger navigation).
     */
    protected async waitForPageLoad(): Promise<void> {
        await test.step('Chờ page load hoàn tất', async () => {
            try {
                await this.page.waitForLoadState('domcontentloaded', {
                    timeout: CONFIG.TIMEOUTS.NAVIGATION,
                });
            } catch (error) {
                await this.attachErrorScreenshot('waitForPageLoad');
                throw error;
            }
        });
    }

    // ─────────────────────────────────────────────
    // CORE ACTIONS
    // ─────────────────────────────────────────────

    /**
     * Click vào element. Chờ visible trước khi click.
     */
    protected async click(locator: Locator, stepName: string): Promise<void> {
        await test.step(`Click vào: ${stepName}`, async () => {
            try {
                await expect(locator).toBeVisible({ timeout: CONFIG.TIMEOUTS.UI_ACTION });
                await locator.click();
                console.log(`[SUCCESS] Click: ${stepName}`);
            } catch (error) {
                await this.attachErrorScreenshot(`click: ${stepName}`);
                throw error;
            }
        });
    }

    /**
     * Hover vào element (dùng cho tooltip, menu dropdown trigger).
     */
    protected async hover(locator: Locator, stepName: string): Promise<void> {
        await test.step(`Hover vào: ${stepName}`, async () => {
            try {
                await expect(locator).toBeVisible({ timeout: CONFIG.TIMEOUTS.UI_ACTION });
                await locator.hover();
                console.log(`[SUCCESS] Hover: ${stepName}`);
            } catch (error) {
                await this.attachErrorScreenshot(`hover: ${stepName}`);
                throw error;
            }
        });
    }

    /**
     * Điền giá trị vào input field. Clear trước khi fill để tránh append.
     */
    protected async fillField(locator: Locator, value: string, fieldName: string): Promise<void> {
        await test.step(`Điền "${value}" vào: ${fieldName}`, async () => {
            try {
                await locator.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUTS.UI_ACTION });
                await locator.clear();
                await locator.fill(value);
                await expect(locator).toHaveValue(value, { timeout: CONFIG.TIMEOUTS.UI_ACTION });
                console.log(`[SUCCESS] fillField: ${fieldName} = "${value}"`);
            } catch (error) {
                await this.attachErrorScreenshot(`fillField: ${fieldName}`);
                throw error;
            }
        });
    }

    // ─────────────────────────────────────────────
    // CHECKBOX / TOGGLE
    // ─────────────────────────────────────────────

    /**
     * Set trạng thái checkbox. Idempotent — không click nếu đã đúng trạng thái.
     */
    protected async setCheckbox(
        locator: Locator,
        isChecked: boolean,
        fieldName: string
    ): Promise<void> {
        await test.step(`${isChecked ? 'Check' : 'Uncheck'}: ${fieldName}`, async () => {
            try {
                await locator.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUTS.UI_ACTION });

                const currentState = await locator.isChecked();

                if (currentState !== isChecked) {
                    await (isChecked ? locator.check() : locator.uncheck());
                    console.log(`[SUCCESS] setCheckbox: ${fieldName} → ${isChecked ? 'Checked' : 'Unchecked'}`);
                } else {
                    console.log(`[SKIP] setCheckbox: ${fieldName} đã ở trạng thái ${isChecked ? 'Checked' : 'Unchecked'}`);
                }

                await expect(locator).toBeChecked({
                    checked: isChecked,
                    timeout: CONFIG.TIMEOUTS.UI_ACTION,
                });
            } catch (error) {
                await this.attachErrorScreenshot(`setCheckbox: ${fieldName}`);
                throw error;
            }
        });
    }

    // ─────────────────────────────────────────────
    // DROPDOWN — NATIVE <select>
    // ─────────────────────────────────────────────

    /**
     * Chọn ngẫu nhiên một option trong native <select>.
     * @param hasPlaceholder - true nếu option đầu tiên là placeholder (bỏ qua khi random)
     */
    protected async selectRandomDropdown(
        locator: Locator,
        fieldName: string,
        hasPlaceholder: boolean = true
    ): Promise<void> {
        await test.step(`Chọn ngẫu nhiên dropdown: ${fieldName}`, async () => {
            try {
                await locator.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUTS.UI_ACTION });

                const options = locator.locator('option');
                const count = await options.count();
                const startIndex = hasPlaceholder ? 1 : 0;

                if (count <= startIndex) {
                    throw new Error(`Dropdown "${fieldName}" không có đủ tùy chọn để chọn ngẫu nhiên (count=${count}).`);
                }

                const randomIndex = Math.floor(Math.random() * (count - startIndex)) + startIndex;
                const selectedOption = options.nth(randomIndex);

                // FIX: Dùng ?? thay vì || để handle empty string đúng cách
                const rawValue =
                    (await selectedOption.getAttribute('value')) ??
                    (await selectedOption.innerText()).trim();

                const value = rawValue.trim();

                if (!value) {
                    throw new Error(`Không lấy được giá trị option tại index ${randomIndex} của "${fieldName}".`);
                }

                console.log(`[ACTION] selectRandomDropdown: ${fieldName} → "${value}"`);
                await locator.selectOption(value);
                await expect(locator).toHaveValue(value, { timeout: CONFIG.TIMEOUTS.UI_ACTION });

                console.log(`[SUCCESS] selectRandomDropdown: ${fieldName} = "${value}"`);
            } catch (error) {
                await this.attachErrorScreenshot(`selectRandomDropdown: ${fieldName}`);
                throw error;
            }
        });
    }

    // ─────────────────────────────────────────────
    // DROPDOWN — CUSTOM (non-native)
    // ─────────────────────────────────────────────

    /**
     * Chọn ngẫu nhiên một option trong custom dropdown (không phải native <select>).
     * @param triggerLocator  - Element cần click để mở dropdown
     * @param listLocator     - Container chứa danh sách option
     * @param optionLocator   - Locator của từng option item
     * @param fieldName       - Tên field (dùng trong log và step name)
     */
    protected async selectRandomCustomDropdown(
        triggerLocator: Locator,
        listLocator: Locator,
        optionLocator: Locator,
        fieldName: string
    ): Promise<void> {
        await test.step(`Chọn ngẫu nhiên custom dropdown: ${fieldName}`, async () => {
            try {
                await triggerLocator.click();
                await listLocator.waitFor({ state: 'visible', timeout: CONFIG.TIMEOUTS.UI_ACTION });

                // FIX: Filter đủ các dạng disabled của custom dropdown
                const activeOptions = optionLocator.filter({
                    hasNot: this.page.locator('[disabled], [aria-disabled="true"], .is-disabled, .disabled'),
                });

                const count = await activeOptions.count();

                if (count === 0) {
                    throw new Error(`Không tìm thấy option khả dụng nào cho "${fieldName}".`);
                }

                const randomIndex = Math.floor(Math.random() * count);
                const randomOption = activeOptions.nth(randomIndex);
                const text = (await randomOption.innerText()).trim();

                console.log(`[ACTION] selectRandomCustomDropdown: ${fieldName} → "${text}"`);
                await randomOption.click();

                await expect(listLocator).toBeHidden({ timeout: CONFIG.TIMEOUTS.UI_ACTION });
                console.log(`[SUCCESS] selectRandomCustomDropdown: ${fieldName} = "${text}"`);
            } catch (error) {
                await this.attachErrorScreenshot(`selectRandomCustomDropdown: ${fieldName}`);
                throw error;
            }
        });
    }

    // ─────────────────────────────────────────────
    // GETTERS / ASSERTIONS HELPERS
    // ─────────────────────────────────────────────

    /**
     * Lấy text content của element.
     */
    protected async getText(locator: Locator, fieldName: string): Promise<string> {
        return test.step(`Lấy text của: ${fieldName}`, async () => {
            try {
                await expect(locator).toBeVisible({ timeout: CONFIG.TIMEOUTS.UI_ACTION });
                const text = (await locator.innerText()).trim();
                console.log(`[SUCCESS] getText: ${fieldName} = "${text}"`);
                return text;
            } catch (error) {
                await this.attachErrorScreenshot(`getText: ${fieldName}`);
                throw error;
            }
        });
    }

    /**
     * Kiểm tra element có visible hay không (soft check, không throw).
     * Dùng cho conditional logic, không dùng để assert.
     */
    protected async isVisible(locator: Locator): Promise<boolean> {
        return locator.isVisible();
    }

    /**
     * Chờ một selector xuất hiện trên trang.
     * @param selector - CSS selector hoặc text selector
     * @param state    - 'visible' | 'hidden' | 'attached' | 'detached'
     */
    protected async waitForSelector(
        selector: string,
        state: 'visible' | 'hidden' | 'attached' | 'detached' = 'visible'
    ): Promise<void> {
        await test.step(`Chờ selector "${selector}" ở trạng thái: ${state}`, async () => {
            try {
                await this.page.waitForSelector(selector, {
                    state,
                    timeout: CONFIG.TIMEOUTS.UI_ACTION,
                });
            } catch (error) {
                await this.attachErrorScreenshot(`waitForSelector: ${selector}`);
                throw error;
            }
        });
    }
}