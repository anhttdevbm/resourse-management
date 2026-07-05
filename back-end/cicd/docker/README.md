# Docker Setup for Resource Management

## 🚀 Quick Start

### Prerequisites
- Docker & Docker Compose installed
- Git

### Build and Run

```bash
# 1. Tạo back-end/.env (lần đầu)
cp back-end/.env.sample back-end/.env

# 2. Start full stack: DB + MinIO + API + Frontend + Adminer
cd back-end/cicd/docker
docker compose up --build

# Or run in background
docker compose up --build -d
```

### Services

- **Frontend (React/Vite)**: http://localhost:5173
- **API**: http://localhost:30111
- **API docs**: http://localhost:30111/docs
- **Database**: PostgreSQL on port 5432
- **MinIO**: http://localhost:9000 (API) / http://localhost:9001 (Console)
- **Adminer**: http://localhost:8085 (Database admin)

### Default Credentials

#### Database
- User: `admin`
- Password: `123456`
- Database: `resource_db`

#### MinIO
- Access Key: `minioadmin`
- Secret Key: `minioadmin`

### Environment Configuration

Sửa file **`back-end/.env`** — Docker đọc file này khi **restart**, **không cần build lại**:

```bash
# Tạo lần đầu (nếu chưa có)
cp back-end/.env.sample back-end/.env
```

Frontend đọc `VITE_API_URL` (mặc định trong compose: `http://localhost:30111`).
Chạy frontend ngoài Docker:

```bash
cp font-end/.env.example font-end/.env.development
cd font-end && npm install && npm run dev
```

Trong Docker, các biến sau được override tự động trong `docker-compose.yml`:
- `HOST_DB=db` (tên service PostgreSQL)
- `AWS_HOST=http://minio:9000`

Sau khi sửa `.env`:

```bash
docker compose restart api
# hoặc
docker compose up -d api
```

### Useful Commands

```bash
# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Rebuild specific service
docker-compose up --build api

# Access database
docker-compose exec db psql -U admin -d resource_db

# Access MinIO console
open http://localhost:9001
```

### Troubleshooting

1. **Port conflicts**: Change ports in `docker-compose.yml`
2. **Database connection**: Ensure PostgreSQL is running before API starts
3. **MinIO connection**: Check AWS_HOST in environment variables
4. **Migration errors**: Check database permissions and connection string

### Development

Chạy full stack local (khuyến nghị):

```bash
cp back-end/.env.sample back-end/.env
cd back-end/cicd/docker
docker compose up --build -d
# Frontend: http://localhost:5173  |  API: http://localhost:30111
```

Chỉ backend + DB/MinIO, frontend chạy riêng với hot reload nhanh hơn:

```bash
docker compose up db minio api -d
cp font-end/.env.example font-end/.env.development
cd font-end && npm install && npm run dev
```
