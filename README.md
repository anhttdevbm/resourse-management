# Resource Management System (RMS)

Monorepo gồm frontend và backend.

## Cấu trúc

```
resource-management/
├── font-end/          # React + TypeScript + Vite
├── back-end/          # FastAPI + PostgreSQL
├── .gitignore
└── README.md
```

## Frontend

```bash
cd font-end
npm install
npm run dev
```

## Backend

```bash
cd back-end
# Tạo virtualenv, cài dependencies (xem back-end/cicd/requirements/)
python -m venv .venv
.venv\Scripts\activate
pip install -r cicd/requirements/requirements.txt
# Copy .env.sample → .env và cấu hình
```

## Lưu ý Git

- Không commit: `node_modules/`, `.env`, `__pycache__/`, virtualenv.
- File mẫu cấu hình: `back-end/.env.sample`, `back-end/cicd/config/.env.sample`.
