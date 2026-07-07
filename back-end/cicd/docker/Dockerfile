FROM python:3.11-slim-bookworm as setup_env

RUN apt-get update && apt-get upgrade -y && apt-get install -y postgresql-client
ENV PERSONAL_ACCESS_TOKEN=$PERSONAL_ACCESS_TOKEN
RUN echo $PERSONAL_ACCESS_TOKEN

# Copy requirements
COPY cicd/requirements/requirements.txt .

# Install any needed packages specified in requirements.txt
RUN pip3 install --no-cache-dir -r requirements.txt

RUN rm requirements.txt

WORKDIR /app

FROM setup_env as alembic_migration

# Copy migration files
COPY migration/ ./migration/

# Copy environment sample
COPY cicd/config/.env.sample ./.env

# Create pre_start script with proper line endings
RUN echo '#!/bin/sh' > pre_start.sh && \
    echo 'set -e' >> pre_start.sh && \
    echo 'echo "🚀 Starting pre-start script..."' >> pre_start.sh && \
    echo 'echo "⏳ Waiting for database to be ready..."' >> pre_start.sh && \
    echo 'until pg_isready -h db -p 5432 -U admin; do' >> pre_start.sh && \
    echo '  echo "Database is unavailable - sleeping"' >> pre_start.sh && \
    echo '  sleep 2' >> pre_start.sh && \
    echo 'done' >> pre_start.sh && \
    echo 'echo "✅ Database is ready!"' >> pre_start.sh && \
    echo 'echo "🔄 Running database migrations..."' >> pre_start.sh && \
    echo 'cd migration && alembic upgrade head' >> pre_start.sh && \
    echo 'echo "✅ Pre-start script completed!"' >> pre_start.sh && \
    chmod +x pre_start.sh

FROM setup_env as server_run

# Copy app source code
COPY app/ ./app/
COPY migration/ ./migration/
COPY scripts/ ./scripts/

# .env is mounted at runtime via docker-compose (back-end/.env -> /app/.env)
# Create start script with proper line endings
RUN echo '#!/bin/sh' > start.sh && \
    echo 'set -e' >> start.sh && \
    echo 'ENV_PATH="${ENV_FILE:-/app/.env}"' >> start.sh && \
    echo 'if [ ! -f "$ENV_PATH" ]; then' >> start.sh && \
    echo '  echo "Missing $ENV_PATH — copy back-end/.env or cicd/config/.env.sample"' >> start.sh && \
    echo '  exit 1' >> start.sh && \
    echo 'fi' >> start.sh && \
    echo 'until pg_isready -h "${HOST_DB:-db}" -p "${PORT_DB:-5432}" -U "${USERNAME_DB:-admin}"; do sleep 2; done' >> start.sh && \
    echo 'cd migration && alembic upgrade head' >> start.sh && \
    echo 'export PYTHONPATH=/app' >> start.sh && \
    echo 'python3 /app/scripts/bootstrap_admin.py || true' >> start.sh && \
    echo 'python3 /app/scripts/seed_classification_defaults.py || true' >> start.sh && \
    echo 'cd /app/app' >> start.sh && \
    echo 'python3 main.py' >> start.sh && \
    chmod +x start.sh

EXPOSE 30111

CMD ["./start.sh"]
