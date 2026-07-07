#!/bin/sh
set -e

ENV_PATH="${ENV_FILE:-/app/.env}"

echo "==> Waiting for PostgreSQL..."
until pg_isready -h "${HOST_DB:-db}" -p "${PORT_DB:-5432}" -U "${USERNAME_DB:-rms_admin}"; do
  echo "   Database unavailable — retry in 2s"
  sleep 2
done
echo "==> Database is ready"

echo "==> Running Alembic migrations..."
cd /app/migration
alembic -c alembic.ini upgrade head

echo "==> Bootstrapping admin user (AllAccess)..."
export PYTHONPATH=/app
python3 /app/scripts/bootstrap_admin.py || echo "   Bootstrap skipped or already done"

echo "==> Seeding classification defaults..."
python3 /app/scripts/seed_classification_defaults.py || echo "   Classification seed skipped or already done"

echo "==> Seeding demo data..."
python3 /app/scripts/seed_demo_data.py || echo "   Demo seed skipped or already done"

echo "==> Starting API server..."
cd /app/app
exec python3 main.py
