"""doc."""
import sys
from pathlib import Path

# Docker: /app/app/main.py — package `app` nằm tại /app/app, cần /app trên PYTHONPATH
_root = str(Path(__file__).resolve().parent.parent)
if _root not in sys.path:
    sys.path.insert(0, _root)

import decouple
import uvicorn

import bootstrap_env  # noqa: F401 — cùng thư mục với main.py

if __name__ == '__main__':
    bootstrap_env.configure_env()
    port = int(decouple.config('PORT'))
    workers = int(decouple.config('WORKERS'))
    uvicorn.run("src.app:app", host=decouple.config('HOST'), port=port, workers=workers, reload=False)
