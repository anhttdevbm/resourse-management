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

## Demo seed data (tự động)

Sau migration, hệ thống cũng nạp dữ liệu demo (mô phỏng ~3 tháng vận hành) nếu `SEED_DEMO_DATA=true`:

| Biến | Mô tả |
|------|--------|
| `SEED_DEMO_DATA` | `true` / `false` — bật/tắt seed demo (mặc định `true`) |
| `SEED_DEMO_PASSWORD` | Mật khẩu user demo (mặc định `Demo@2026!`) |

**Tài khoản demo** (email/password):

- `nguyen.van.a@demo.local` — Nguyễn Văn A
- `tran.thi.b@demo.local` — Trần Thị B
- `le.van.c@demo.local` — Lê Văn C
- `pham.thi.d@demo.local` — Phạm Thị D
- `hoang.van.e@demo.local` — Hoàng Văn E

Mật khẩu: `Demo@2026!` (hoặc `SEED_DEMO_PASSWORD`).

Seed chỉ chạy **một lần** (idempotent). Để seed lại từ đầu:

```bash
cd deploy
docker compose --env-file product.env down -v
./deploy.sh
```

Tắt seed trên server production thật: đặt `SEED_DEMO_DATA=false` trong `product.env`.

Chạy lại bootstrap thủ công:

```bash
cd deploy
docker compose --env-file product.env exec api python3 /app/scripts/bootstrap_admin.py
docker compose --env-file product.env exec api python3 /app/scripts/seed_demo_data.py
```

## CI/CD (GitHub Actions)

File: `.github/workflows/ci-cd.yml`

- **PR / push**: kiểm tra backend import, build frontend
- **push main/master**: build Docker images
- **Deploy SSH** (tùy chọn): cấu hình secrets:
  - `DEPLOY_HOST`
  - `DEPLOY_USER`
  - `DEPLOY_SSH_KEY`
- Và **Variables** (Settings → Secrets and variables → Actions → Variables):
  - `DEPLOY_ENABLED` = `true` (bật auto-deploy)
  - `DEPLOY_PATH` = `/opt/resourse-management` (tuỳ chọn)
  - `DEPLOY_PORT` = `22` (tuỳ chọn)

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
