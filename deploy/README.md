# Resource Management — Production Deploy

## Yêu cầu

- Docker 24+ & Docker Compose v2
- Git
- Port 80 (hoặc đổi `HTTP_PORT` trong `product.env`)

## Port mặc định (1070–1074)

| Port host | Service | Mô tả |
|-----------|---------|--------|
| **1070** | nginx | Web + API proxy (truy cập chính) |
| **1071** | api | FastAPI trực tiếp (debug) |
| **1072** | db | PostgreSQL |
| **1073** | minio | MinIO S3 API |
| **1074** | minio | MinIO Console (UI) |

Đổi trong `product.env`: `HTTP_PORT`, `API_HOST_PORT`, `POSTGRES_HOST_PORT`, `MINIO_HOST_PORT`, `MINIO_CONSOLE_HOST_PORT`.

**Production:** chỉ mở **1070** ra internet; các port còn lại nên chặn firewall hoặc bind `127.0.0.1` nếu chỉ dùng nội bộ.

Domain `resources.rugal.vn` → reverse proxy (Caddy/nginx/Cloudflare) trỏ tới `http://127.0.0.1:1070`.

## Cấu trúc

```
deploy/
  product.env          # Biến môi trường production (KHÔNG commit secret thật)
  product.env.example  # Template
  docker-compose.yml   # db + minio + api + nginx
  deploy.sh            # Script deploy chính
  nginx/nginx.conf     # Reverse proxy + SPA
  docker/
    Dockerfile.api
    Dockerfile.nginx
    start-api.sh
```

## Deploy nhanh

```bash
# 1. Chỉnh product.env (mật khẩu, SECRET_KEY, PUBLIC_URL)
cp deploy/product.env.example deploy/product.env
nano deploy/product.env

# 2. Deploy
chmod +x deploy/deploy.sh deploy.sh
./deploy.sh
```

Truy cập: **http://localhost** (hoặc `PUBLIC_URL`)

## Admin tự động

Sau migration, hệ thống tự:

1. Tạo user `BOOTSTRAP_ADMIN_EMAIL` nếu chưa có
2. Gán permission **AllAccess** (full quyền admin)

Mặc định trong `product.env`:

| Biến | Giá trị |
|------|---------|
| `BOOTSTRAP_ADMIN_EMAIL` | anhttdevbm@gmail.com |
| `BOOTSTRAP_ADMIN_PASSWORD` | *(đổi trong product.env)* |
| `BOOTSTRAP_ADMIN_NAME` | Admin |

Đăng nhập tại `/login` bằng email + mật khẩu trên.

Chạy lại bootstrap thủ công:

```bash
cd deploy
docker compose --env-file product.env exec api python3 /app/scripts/bootstrap_admin.py
```

## CI/CD (GitHub Actions)

File: `.github/workflows/ci-cd.yml`

- **PR / push**: kiểm tra backend import, build frontend
- **push main/master**: build Docker images
- **Deploy SSH** (tùy chọn): cấu hình secrets:
  - `DEPLOY_HOST`
  - `DEPLOY_USER`
  - `DEPLOY_SSH_KEY`
  - `DEPLOY_PATH` (mặc định `/opt/resource-management`)

## Lệnh thường dùng

```bash
cd deploy

# Xem log
docker compose --env-file product.env logs -f

# Dừng
docker compose --env-file product.env down

# Rebuild sau khi đổi code
docker compose --env-file product.env build --no-cache
./deploy.sh

# Vào DB
docker compose --env-file product.env exec db psql -U rms_admin -d resource_db
```

## Production checklist

- [ ] Đổi `SECRET_KEY`, `POSTGRES_PASSWORD`, `MINIO_ROOT_PASSWORD`
- [ ] Đổi `BOOTSTRAP_ADMIN_PASSWORD`
- [ ] Cập nhật `PUBLIC_URL` và `CORS_ORIGINS`
- [ ] Cấu hình HTTPS (reverse proxy / Let's Encrypt phía trước nginx)
- [ ] Không commit `deploy/product.env` lên Git
