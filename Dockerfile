# 1. Sử dụng image chuẩn của Playwright (đã bao gồm trình duyệt và driver)
FROM mcr.microsoft.com/playwright:v1.60.0-jammy

# 2. Thiết lập thư mục làm việc bên trong container
WORKDIR /app

# 3. Copy file cấu hình package để cài đặt dependencies
COPY package*.json ./

# 4. Cài đặt các thư viện cần thiết
RUN npm install

# 5. Copy toàn bộ mã nguồn của bạn vào container
COPY . .

# 6. Lệnh chạy test (đã bao gồm --workers=1 theo ý muốn của bạn)
CMD ["npx", "playwright", "test", "--workers=1"]