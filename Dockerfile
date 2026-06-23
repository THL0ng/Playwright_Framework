# 1. Dùng image chính chủ của Playwright — đã có sẵn browser + driver tương thích
FROM mcr.microsoft.com/playwright:v1.60.0-jammy

# 2. Thư mục làm việc trong container
WORKDIR /app

# 3. Copy file cấu hình package trước để cache layer install (đỡ rebuild lại khi chỉ sửa code test)
COPY package*.json ./

# 4. Cài dependencies
RUN npm ci

# 5. Copy toàn bộ source vào container
COPY . .

# 6. Lệnh mặc định khi chạy container (có thể override khi cần)
CMD ["npx", "playwright", "test", "--workers=1"]