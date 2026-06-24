# --- CẤU HÌNH ---
# Tự động lấy 7 ký tự đầu của Git Hash làm tag
TAG := $(shell git rev-parse --short HEAD)

# Tên image của bạn
IMAGE_NAME := playwright-tests

# --- CÁC LỆNH ---
.PHONY: build run clean

# Build image với 2 tag: tag theo hash và tag latest
build:
	@echo "Đang build image với tag: $(TAG)"
	docker build -t $(IMAGE_NAME):$(TAG) -t $(IMAGE_NAME):latest .

# Chạy test với tag khớp với hash hiện tại
run:
	@echo "Đang chạy test với tag: $(TAG)"
	TAG=$(TAG) docker compose run --rm playwright

# Xem cấu hình compose hiện tại (để debug)
config:
	TAG=$(TAG) docker compose config

# Dọn nhẹ nhàng (chỉ xóa image rác)
clean:
	docker image prune -f

# Dọn sạch sành sanh (xóa cả volume rác, thường dùng khi muốn reset môi trường)
clean-all:
	docker system prune -f --volumes