"""Load .env before any module reads decouple.config."""
from __future__ import annotations

import os
from pathlib import Path

import decouple

_CONFIGURED = False


def configure_env() -> None:
    global _CONFIGURED
    if _CONFIGURED:
        return

    candidates = [
        os.environ.get("ENV_FILE"),
        "/app/.env",
        str(Path(__file__).resolve().parent.parent / ".env"),
        str(Path(__file__).resolve().parent / ".env"),
        ".env",
    ]

    for path in candidates:
        if path and os.path.isfile(path):
            decouple.config = decouple.Config(decouple.RepositoryEnv(path))
            _CONFIGURED = True
            return

    _CONFIGURED = True


configure_env()
