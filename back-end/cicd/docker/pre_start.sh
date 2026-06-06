#! /usr/bin/env sh
set -e

echo "ðŸš€ Starting pre-start script..."

# Wait for database to be ready
echo "â³ Waiting for database to be ready..."
until pg_isready -h db -p 5432 -U admin; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "âœ… Database is ready!"

# Run migrations
echo "ðŸ”„ Running database migrations..."
alembic upgrade head

echo "âœ… Pre-start script completed!"
