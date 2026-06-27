#!/usr/bin/env bash
# =============================================================================
# RMS — Production deploy script
# Chạy từ thư mục gốc repo:  ./deploy/deploy.sh
# Hoặc:                        bash deploy/deploy.sh
# =============================================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
DEPLOY_DIR="${ROOT_DIR}/deploy"
ENV_FILE="${DEPLOY_DIR}/product.env"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn]${NC} $*"; }
err()  { echo -e "${RED}[error]${NC} $*" >&2; }

require_cmd() {
  if ! command -v "$1" >/dev/null 2>&1; then
    err "Thiếu lệnh: $1"
    exit 1
  fi
}

require_cmd docker
if docker compose version >/dev/null 2>&1; then
  COMPOSE="docker compose"
elif command -v docker-compose >/dev/null 2>&1; then
  COMPOSE="docker-compose"
else
  err "Cần Docker Compose (docker compose hoặc docker-compose)"
  exit 1
fi

cd "${DEPLOY_DIR}"

if [[ ! -f "${ENV_FILE}" ]]; then
  if [[ -f "${DEPLOY_DIR}/product.env.example" ]]; then
    warn "Chưa có product.env — copy từ product.env.example"
    cp "${DEPLOY_DIR}/product.env.example" "${ENV_FILE}"
  else
    err "Không tìm thấy ${ENV_FILE}"
    exit 1
  fi
fi

# shellcheck disable=SC1090
set -a
source "${ENV_FILE}"
set +a

if [[ "${BOOTSTRAP_ADMIN_PASSWORD:-}" == "ChangeMe@RMS2026!" ]]; then
  warn "Đang dùng mật khẩu mặc định BOOTSTRAP_ADMIN_PASSWORD — hãy đổi trong product.env trước khi deploy production!"
fi

if [[ "${SECRET_KEY:-}" == *"change"* ]] || [[ "${#SECRET_KEY:-}" -lt 24 ]]; then
  warn "SECRET_KEY yếu hoặc mặc định — hãy đổi trong product.env!"
fi

log "Project: ${COMPOSE_PROJECT_NAME:-rms}"
log "Public URL: ${PUBLIC_URL:-http://localhost}"
log "Bootstrap admin: ${BOOTSTRAP_ADMIN_EMAIL:-<not set>}"
log "Ports: web=${HTTP_PORT:-1070} api=${API_HOST_PORT:-1071} db=${POSTGRES_HOST_PORT:-1072} minio=${MINIO_HOST_PORT:-1073} minio-ui=${MINIO_CONSOLE_HOST_PORT:-1074}"

log "Building images..."
${COMPOSE} --env-file product.env build --pull

log "Starting services..."
${COMPOSE} --env-file product.env up -d

log "Waiting for API health..."
TRIES=0
MAX_TRIES=40
until ${COMPOSE} --env-file product.env ps api | grep -q "(healthy)"; do
  TRIES=$((TRIES + 1))
  if [[ ${TRIES} -ge ${MAX_TRIES} ]]; then
    err "API không healthy sau ${MAX_TRIES} lần thử. Xem log:"
    ${COMPOSE} --env-file product.env logs --tail=80 api
    exit 1
  fi
  sleep 3
done

log "Ensuring bootstrap admin (AllAccess)..."
${COMPOSE} --env-file product.env exec -T api python3 /app/scripts/bootstrap_admin.py || true

log "Service status:"
${COMPOSE} --env-file product.env ps

echo ""
log "Deploy hoàn tất!"
echo "  Web:        http://localhost:${HTTP_PORT:-1070}"
echo "  API docs:   http://localhost:${API_HOST_PORT:-1071}/docs"
echo "  PostgreSQL: localhost:${POSTGRES_HOST_PORT:-1072}"
echo "  MinIO:      localhost:${MINIO_HOST_PORT:-1073}"
echo "  MinIO UI:   http://localhost:${MINIO_CONSOLE_HOST_PORT:-1074}"
echo "  Admin:      ${BOOTSTRAP_ADMIN_EMAIL}"
echo ""
echo "  (Reverse proxy domain → http://127.0.0.1:${HTTP_PORT:-1070})"
echo ""
echo "  Lệnh hữu ích:"
echo "    ${COMPOSE} --env-file product.env logs -f"
echo "    ${COMPOSE} --env-file product.env down"
echo "    ${COMPOSE} --env-file product.env restart api"
