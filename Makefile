# --- CẤU HÌNH ---
# Dùng ?= để CI runner có thể truyền giá trị vào
TAG ?= $(shell git rev-parse --short HEAD)
IMAGE_NAME := playwright-tests
WORKERS ?= 1
ENV ?= ci
# Cho phép tùy chỉnh tài nguyên từ biến môi trường của CI/Host
CI_CPUS ?= 2
CI_MEM ?= 4g

# Đường dẫn folder chứa file cấu hình Docker
DOCKER_DIR := docker

.PHONY: build prepare-dirs run-dev run-ci run-ci-app shell logs down clean clean-all

# 1. Build: Chỉ build khi cần, hỗ trợ fail-fast nếu thiếu biến
build:
	@echo "--- Đang build image: $(IMAGE_NAME):$(TAG) ---"
	docker build -f $(DOCKER_DIR)/Dockerfile -t $(IMAGE_NAME):$(TAG) .
	@if [ -z "$$CI" ]; then docker tag $(IMAGE_NAME):$(TAG) $(IMAGE_NAME):latest; fi

# 2. Prepare: Đảm bảo quyền sở hữu folder
prepare-dirs:
	@mkdir -p playwright-report test-results

# 3. Dev: Chạy với bind-mount code
run-dev: prepare-dirs
	TAG=$(TAG) CI_CPUS=$(CI_CPUS) CI_MEM=$(CI_MEM) \
	docker compose -f $(DOCKER_DIR)/docker-compose.yml -f $(DOCKER_DIR)/docker-compose.dev.yml run --rm playwright \
	npx playwright test --workers=$(WORKERS)

# 4. CI: Chạy theo chuẩn Production (Không bind-mount, dùng image cố định)
# Tự động inject biến vào các file compose đã cấu hình
run-ci: prepare-dirs
	TAG=$(TAG) CI_CPUS=$(CI_CPUS) CI_MEM=$(CI_MEM) ENV_FILE=.env.$(ENV) \
	docker compose -f $(DOCKER_DIR)/docker-compose.ci.yml run --rm playwright \
	npx playwright test --workers=$(WORKERS)

# 5. CI-App: Chạy tích hợp (App + Playwright)
run-ci-app: prepare-dirs
	TAG=$(TAG) CI_CPUS=$(CI_CPUS) CI_MEM=$(CI_MEM) ENV_FILE=.env.$(ENV) \
	docker compose -f $(DOCKER_DIR)/docker-compose.ci.yml -f $(DOCKER_DIR)/docker-compose.ci.app.yml up --abort-on-container-exit

# 6. Shell: Debug trực tiếp với môi trường giống dev
shell:
	TAG=$(TAG) docker compose -f $(DOCKER_DIR)/docker-compose.dev.yml run --rm --entrypoint /bin/bash playwright

# 7. Utilities
logs:
	docker compose -f $(DOCKER_DIR)/docker-compose.yml logs -f

down:
	docker compose -f $(DOCKER_DIR)/docker-compose.yml down

.PHONY: clean clean-all

clean:
	@echo "Dọn dẹp các dangling images..."
	docker image prune -f
	@echo "Xong."

clean-all:
	@echo "CẢNH BÁO: Đang xóa sạch tất cả container, volume và image không dùng đến!"
	docker system prune -f --volumes
	@echo "Môi trường đã được làm sạch hoàn toàn."