"""Utilities to bridge notification events via Redis."""
from __future__ import annotations

import json
import logging
from typing import Tuple

from decouple import config
from redis import Redis
from redis.asyncio import Redis as AsyncRedis

REDIS_HOST = config("REDIS_HOST", default="localhost")
REDIS_PORT = config("REDIS_PORT", default=6379, cast=int)
REDIS_PASSWORD = config("REDIS_PASSWORD", default=None)

CHANNEL_PREFIX = "notifications:user:"

_sync_client = Redis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    decode_responses=True,
)
_async_client = AsyncRedis(
    host=REDIS_HOST,
    port=REDIS_PORT,
    password=REDIS_PASSWORD,
    decode_responses=True,
)


def _channel_name(user_id: str) -> str:
    return f"{CHANNEL_PREFIX}{user_id}"


def publish_notification_event(user_id: str, payload: dict) -> None:
    """Send payload to user specific channel."""
    try:
        message = json.dumps(payload, default=str)
        _sync_client.publish(_channel_name(user_id), message)
    except Exception as exc:  # pragma: no cover - log only
        logging.error("Failed to publish notification event: %s", exc)


async def subscribe_notification_channel(user_id: str):
    """Subscribe to user channel and return (pubsub, channel_name)."""
    pubsub = _async_client.pubsub()
    channel = _channel_name(user_id)
    await pubsub.subscribe(channel)
    return pubsub, channel

