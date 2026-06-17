import { Page, Locator, Response, expect, test } from '@playwright/test';
import { CONFIG } from '@constants/config';


export class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    //----------------------------------------------------------------------------------------------------------------------
    // PERFORM ACTION
    //----------------------------------------------------------------------------------------------------------------------
    protected async performAction<T = void>(
        stepDescription: string,
        action: () => Promise<T>
    ): Promise<T> {
        return test.step(stepDescription, async () => {
            try {
                const result = await action();
                console.log(`[PASS] | step="${stepDescription}"`);
                return result;
            } catch (error) {
                await this.onActionError(stepDescription, error);
                throw error; // always reached — onActionError never throws
            }
        });
    }

    protected async onActionError(
        stepDescription: string,
        error: unknown
    ): Promise<void> {
        try {
            console.error(
                `[FAIL] | step="${stepDescription}" | reason="${error instanceof Error ? error.message : String(error)}"`
            );

            // Only capture screenshot if page is still active
            // to avoid compounding errors on top of the original failure
            if (!this.page.isClosed()) {
                const screenshot = await this.page.screenshot({ fullPage: true, timeout: 5000 });
                await test.info().attach(stepDescription, {
                    body: screenshot,
                    contentType: 'image/png',
                });
            }
        } catch (screenshotError) {
            // Do not throw — preserve the original test error
            console.warn(
                `[WARN] | step="${stepDescription}" | reason="${screenshotError instanceof Error ? screenshotError.message : String(screenshotError)}"`
            );
        }
    }



    //----------------------------------------------------------------------------------------------------------------------
    // ACTIONS
    //----------------------------------------------------------------------------------------------------------------------


    protected async click(locator: Locator, stepName: string, options: { timeout?: number } = {}): Promise<void> {
        const timeout = options.timeout ?? CONFIG.TIMEOUTS.UI_ACTION;

        await this.performAction(`Click: ${stepName}`, async () => {
            await expect(locator).toBeVisible({ timeout });
            await expect(locator).toBeEnabled({ timeout });
            await locator.click();
        });
    }

    protected async forceClick(locator: Locator, stepName: string): Promise<void> {
        await this.performAction(`Force Click: ${stepName}`, async () => {
            await expect(locator).toBeAttached();
            await locator.click({ force: true });
        });
    }

    protected async hover(locator: Locator, stepName: string, options: { timeout?: number } = {}): Promise<void> {
        const timeout = options.timeout ?? CONFIG.TIMEOUTS.UI_ACTION;

        await this.performAction(`Hover: ${stepName}`, async () => {
            await expect(locator).toBeVisible({ timeout });

            await locator.scrollIntoViewIfNeeded();

            await locator.hover();
        });
    }

    /**
 * 1. Fill trực tiếp: Tốc độ cao, dùng cho input chuẩn.
 */
    protected async fillField(locator: Locator, value: string, fieldName: string): Promise<void> {
        await this.performAction(`Fill: ${fieldName}`, async () => {
            await expect(locator).toBeVisible();
            await locator.clear();
            await locator.fill(value);
            await expect(locator).toHaveValue(value);
        });
    }

    /**
     * 2. Type từng ký tự: Dùng khi cần trigger sự kiện bàn phím (autocomplete/search).
     */
    protected async typeField(locator: Locator, value: string, fieldName: string, delay: number = 20): Promise<void> {
        await this.performAction(`Type: ${fieldName}`, async () => {
            await expect(locator).toBeVisible();
            await locator.clear();
            await locator.pressSequentially(value, { delay });
        });
    }

    /**
     * 3. Rich Text: Dùng cho các thẻ contenteditable (editor).
     */
    protected async fillRichText(locator: Locator, value: string, fieldName: string, delay: number = 20): Promise<void> {
        await this.performAction(`RichText: ${fieldName}`, async () => {
            await expect(locator).toBeVisible();
            await locator.click();
            await locator.selectText(); // Chọn hết thay vì clear
            await locator.pressSequentially(value, { delay });
            await expect(locator).toContainText(value);
        });
    }

    protected async setCheckbox(
        locator: Locator,
        isChecked: boolean,
        fieldName: string
    ): Promise<void> {
        const actionLabel = isChecked ? 'Check' : 'Uncheck';

        await this.performAction(`Checkbox: ${fieldName} (${actionLabel})`, async () => {
            await expect(locator).toBeVisible();

            const currentState = await locator.isChecked();
            if (currentState !== isChecked) {
                await (isChecked ? locator.check() : locator.uncheck());
            }
            await expect(locator).toBeChecked({ checked: isChecked });
        });
    }

    protected async selectDefaultDropdownByValue(
        locator: Locator,
        value: string,
        fieldName: string
    ): Promise<void> {
        await this.performAction(`Dropdown Value: ${fieldName}`, async () => {
            await expect(locator).toBeVisible();
            await locator.selectOption({ value });
            await expect(locator).toHaveValue(value);
        });
    }

    protected async selectDefaultDropdownByLabel(
        locator: Locator,
        label: string,
        fieldName: string
    ): Promise<void> {
        await this.performAction(`Dropdown Label: ${fieldName}`, async () => {
            await expect(locator).toBeVisible();
            await locator.selectOption({ label });
            await expect(locator.locator('option:checked')).toHaveText(label);
        });
    }

    protected async selectRandomDropdown(
        locator: Locator,
        fieldName: string,
        hasPlaceholder: boolean = true
    ): Promise<string> {
        return this.performAction<string>(`Dropdown Random: ${fieldName}`, async () => {
            await expect(locator).toBeVisible();

            const options = locator.locator('option');
            const count = await options.count();
            const startIndex = hasPlaceholder ? 1 : 0;

            if (count <= startIndex) {
                throw new Error(`Field "${fieldName}" không đủ option (count=${count})`);
            }

            const randomIndex = Math.floor(Math.random() * (count - startIndex)) + startIndex;
            const selectedOption = options.nth(randomIndex);

            const value = (await selectedOption.getAttribute('value') ?? await selectedOption.innerText()).trim();

            if (!value) throw new Error(`Option tại index ${randomIndex} không có giá trị`);

            await locator.selectOption(value);
            await expect(locator).toHaveValue(value);
            return value;
        });
    }

    protected async selectRandomCustomDropdown(
        triggerLocator: Locator,
        listLocator: Locator,
        optionLocator: Locator,
        fieldName: string,
        disabledSelector: string = ''
    ): Promise<string> {
        return this.performAction<string>(`Custom Dropdown Random: ${fieldName}`, async () => {
            await triggerLocator.click();
            await listLocator.waitFor({ state: 'visible' });

            const baseDisabled = '[disabled], [aria-disabled="true"], .is-disabled, .disabled';
            const fullDisabledSelector = disabledSelector ? `${baseDisabled}, ${disabledSelector}` : baseDisabled;

            // Lọc các option khả dụng
            const activeOptions = optionLocator.filter({
                hasNot: this.page.locator(fullDisabledSelector),
            });

            const count = await activeOptions.count();
            if (count === 0) throw new Error(`Field "${fieldName}" không có option khả dụng`);

            const randomIndex = Math.floor(Math.random() * count);
            const randomOption = activeOptions.nth(randomIndex);
            const text = (await randomOption.innerText()).trim();

            await randomOption.click();
            await expect(listLocator).toBeHidden();

            return text;
        });
    }

    protected async getText(locator: Locator, fieldName: string): Promise<string> {
        return this.performAction<string>(`Get Text: ${fieldName}`, async () => {
            await expect(locator).toBeVisible();
            const text = (await locator.innerText()).trim();
            return text;
        });
    }


    protected async getAttribute(locator: Locator, attributeName: string, fieldName: string): Promise<string | null> {
        return this.performAction<string | null>(`Get Attribute [${attributeName}]: ${fieldName}`, async () => {
            await expect(locator).toBeVisible();
            return await locator.getAttribute(attributeName);
        });
    }

    protected async uploadFile(
        locator: Locator,
        filePaths: string | string[],
        fieldName: string,
        options: { timeout?: number } = {}
    ): Promise<void> {
        const timeout = options.timeout ?? CONFIG.TIMEOUTS.UI_ACTION;
    
        await this.performAction(`Upload File: ${fieldName}`, async () => {
            await expect(locator).toBeAttached();
            
            // Thực hiện upload
            await locator.setInputFiles(filePaths, { timeout });
    
            // Verification thủ công (bền vững nhất)
            const files = Array.isArray(filePaths) ? filePaths : [filePaths];
            const expectedNames = files.map(f => f.split(/[\\/]/).pop());
            
            const actualNames = await locator.evaluate((el: HTMLInputElement) => 
                Array.from(el.files || []).map(f => f.name)
            );
    
            expect(actualNames.sort()).toEqual(expectedNames.sort());
        });
    }


    //----------------------------------------------------------------------------------------------------------------------
    // NAVIGATION
    //----------------------------------------------------------------------------------------------------------------------
    protected async scrollToElement(locator: Locator, fieldName: string): Promise<void> {
        await this.performAction(`Scroll To: ${fieldName}`, async () => {
            // Đảm bảo phần tử tồn tại trước khi cuộn
            await expect(locator).toBeVisible();

            // Cuộn phần tử vào Viewport
            await locator.scrollIntoViewIfNeeded();
        });
    }



    //----------------------------------------------------------------------------------------------------------------------
    // WAIT FOR
    //----------------------------------------------------------------------------------------------------------------------
    protected async waitForPageReady(
        targetLocator: Locator,
        state: 'domcontentloaded' | 'load' | 'networkidle' = 'load'
    ): Promise<void> {
        await this.performAction(`Wait For Page Ready: state="${state}"`, async () => {
            // 1. Đợi trang load trạng thái
            await this.page.waitForLoadState(state, {
                timeout: CONFIG.TIMEOUTS.NAVIGATION,
            });

            // 2. Đợi phần tử quan trọng (selector) hiện diện
            await expect(targetLocator).toBeVisible({
                timeout: CONFIG.TIMEOUTS.UI_ACTION
            });
        });
    }

    protected async waitForApiResponse(urlPattern: string | RegExp,
        action: () => Promise<void>,
        statusCode: number = 200,
        responseValidator?: (response: Response) => Promise<void>
    ): Promise<Response> {
        return this.performAction<Response>(
            `Wait For API: ${urlPattern.toString()}`,
            async () => {
                const [response] = await Promise.all([
                    this.page.waitForResponse(
                        (res) =>
                            urlPattern instanceof RegExp
                                ? urlPattern.test(res.url())
                                : res.url().includes(urlPattern),
                        { timeout: CONFIG.TIMEOUTS.API }
                    ),
                    action(),
                ]);

                // Kiểm tra status code
                if (response.status() !== statusCode) {
                    throw new Error(
                        `API Status Mismatch: Expected ${statusCode}, but got ${response.status()} for ${response.url()}`
                    );
                }

                // Thực thi kiểm tra dữ liệu nếu có validator
                if (responseValidator) {
                    await responseValidator(response);
                }

                return response;
            }
        );
    }

    protected async waitForSelector(
        locator: Locator,
        state: 'visible' | 'hidden' | 'attached' | 'detached' = 'visible'
    ): Promise<void> {
        await this.performAction(`Wait For Selector: state="${state}"`, async () => {
            await locator.waitFor({
                state: state,
                timeout: CONFIG.TIMEOUTS.UI_ACTION,
            });
        });
    }


    //----------------------------------------------------------------------------------------------------------------------
    // ASSERT
    //----------------------------------------------------------------------------------------------------------------------

    protected async expectVisible(locator: Locator, fieldName: string): Promise<void> {
        await expect(locator, `[FAIL] ${fieldName} không hiển thị`).toBeVisible();
    }

    protected async expectValue(locator: Locator, expectedValue: string, fieldName: string): Promise<void> {
        await expect(locator, `[FAIL] ${fieldName} có giá trị sai`).toHaveValue(expectedValue);
    }

    protected async expectText(locator: Locator, expectedText: string, fieldName: string): Promise<void> {
        await expect(locator, `[FAIL] ${fieldName} có nội dung sai`).toContainText(expectedText);
    }

    protected async expectChecked(locator: Locator, fieldName: string, isChecked: boolean = true): Promise<void> {
        if (isChecked) {
            await expect(locator, `[FAIL] ${fieldName} chưa được chọn`).toBeChecked();
        } else {
            await expect(locator, `[FAIL] ${fieldName} vẫn đang được chọn`).not.toBeChecked();
        }
    }

    protected async expectDisabled(locator: Locator, fieldName: string, isDisabled: boolean = true): Promise<void> {
        if (isDisabled) {
            await expect(locator, `[FAIL] ${fieldName} đáng lẽ phải bị disabled`).toBeDisabled();
        } else {
            await expect(locator, `[FAIL] ${fieldName} đáng lẽ phải được enabled`).toBeEnabled();
        }
    }

    protected async expectCount(locator: Locator, expectedCount: number, fieldName: string): Promise<void> {
        await expect(locator, `[FAIL] ${fieldName} không có đúng ${expectedCount} phần tử`).toHaveCount(expectedCount);
    }

    protected async expectUrl(expectedUrl: string | RegExp): Promise<void> {
        await expect(this.page, `[FAIL] URL hiện tại không khớp`).toHaveURL(expectedUrl);
    }
}