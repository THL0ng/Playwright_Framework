import { test, expect } from '@playwright/test';
import { DataFactory } from '@utils/data-loader/DataFactory';
import { UserData, UserSchema } from 'src/models/data-schemas';

test.describe('Data Loader Verification', () => {

  // test('Kiểm tra đọc dữ liệu JSON', async () => {
  //   const data = await DataFactory.getProvider('json').read<UserData>('src/data/user.json', UserSchema);
    
  //   expect(data.length).toBe(2);
  //   expect(data[0].username).toBe('user1');
  //   console.log('JSON Data:', data);
  // });

  // test('Kiểm tra đọc dữ liệu CSV', async () => {
  //   const data = await DataFactory.getProvider('csv').read<UserData>('src/data/user.csv', UserSchema);
    
  //   expect(data.length).toBe(2);
  //   expect(data[1].username).toBe('user4');
  //   expect(data[1].email).toBe(''); 
  //   console.log('CSV Data:', data);
  // });

  test('Mở trang chủ', async ({ page }) => {
    await page.goto(process.env.BASE_URL || '');
    await expect(page).toHaveTitle(/.*/);
  });

});