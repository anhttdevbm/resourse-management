#! /usr/bin/env sh
alembic upgrade head

cd app

python3 main.py ../.env
