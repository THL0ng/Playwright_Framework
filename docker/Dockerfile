# 1. Dùng image chính chủ của Playwright
FROM mcr.microsoft.com/playwright:v1.60.0-jammy

# 2. Thư mục làm việc trong container
# Dùng pwuser (Least privilege) thay vì dùng root để tăng độ bảo mật
USER pwuser
WORKDIR /app

# 3. Copy file từ root (thư mục cha) vào container
# Vì Dockerfile đang ở trong folder 'docker/', ta phải dùng ../ để trỏ ra ngoài
# --chown=pwuser:pwuser: Cấp quyền cho pwuser, tránh khi chạy npm bị lỗi Permission Denied
COPY --chown=pwuser:pwuser package*.json package-lock.json ./
#4. Cài dependencies và dọn dẹp cache ngay trong 1 layer
RUN npm ci --quiet && \
    npm cache clean --force

# 5. Copy toàn bộ source code (thay đổi thường xuyên nên để cuối)
COPY --chown=pwuser:pwuser . .

# 6. Lệnh mặc định
CMD ["npx", "playwright", "test", "--workers=1"]