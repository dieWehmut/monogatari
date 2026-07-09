.PHONY: build run docker-build docker-run docker-logs clean

IMAGE ?= monogatari-backend
CONTAINER ?= monogatari-backend

# Go build
build:
	go build -o server ./cmd/server

# 本地运行（需先配置好 .env 环境变量）
run: build
	./server

# Docker 构建镜像
docker-build:
	docker build -t $(IMAGE) .

# Docker 运行（需有 .env 文件）
docker-run:
	docker rm -f $(CONTAINER) 2>/dev/null || true
	docker run -d --name $(CONTAINER) --restart unless-stopped -p 7860:7860 --env-file .env $(IMAGE)

# 查看 Docker 日志
docker-logs:
	docker logs -f $(CONTAINER)

# 清理构建产物
clean:
	rm -f server
