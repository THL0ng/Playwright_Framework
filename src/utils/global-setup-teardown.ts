import { FullConfig } from '@playwright/test';

/**
 * Logic chạy 1 lần duy nhất trước khi bất kỳ bài test nào bắt đầu
 */
async function globalSetup(config: FullConfig) {
  console.log('\n--- [GLOBAL SETUP]: BẮT ĐẦU ---');
  
  // Mẫu: Xóa dữ liệu cũ hoặc khởi tạo môi trường
  console.log('-> Đang kết nối Database/API...');
  console.log('-> Đang chuẩn bị môi trường Staging...');
  
  console.log('--- [GLOBAL SETUP]: HOÀN TẤT ---\n');
}

/**
 * Logic chạy 1 lần duy nhất sau khi toàn bộ bài test đã kết thúc
 */
async function globalTeardown(config: FullConfig) {
  console.log('\n--- [GLOBAL TEARDOWN]: BẮT ĐẦU ---');
  
  // Mẫu: Dọn dẹp dữ liệu, đóng kết nối, gửi báo cáo
  console.log('-> Đang dọn dẹp các tệp tạm...');
  console.log('-> Đang đóng kết nối Database...');
  
  console.log('--- [GLOBAL TEARDOWN]: HOÀN TẤT ---\n');
}

export { globalSetup, globalTeardown };