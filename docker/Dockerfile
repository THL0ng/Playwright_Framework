# 1. Dùng image chính chủ của Playwright
FROM mcr.microsoft.com/playwright:v1.60.0-jammy

# 2. Thư mục làm việc trong container
WORKDIR /app

# 3. Copy file từ root (thư mục cha) vào container
# Vì Dockerfile đang ở trong folder 'docker/', ta phải dùng ../ để trỏ ra ngoài
COPY ../package*.json ./

# 4. Cài dependencies
RUN npm ci

# 5. Copy toàn bộ source từ root vào container
COPY .. .

# 6. Lệnh mặc định
CMD ["npx", "playwright", "test", "--workers=1"]