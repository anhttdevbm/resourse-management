"""Redis setup for caching."""
from typing import Any, Awaitable, Union

import decouple
from redis import Redis


class RedisConnector():
    """Define a redis connection class."""

    def __init__(self, db: int = 0):
        """Initialize a redis connection."""
        self.db = db

    def get_connection(self) -> Redis:
        """Define a redis connection."""
        host = decouple.config("REDIS_HOST")
        port = decouple.config("REDIS_PORT")
        password = decouple.config("REDIS_PASSWORD")
        redis_client = Redis(host=host, port=port, password=password, db=self.db, decode_responses=True)
        return redis_client

    def set(self, key: str, value: Any) -> Union[Awaitable[None], Any]:  # noqa
        """Define method to set a key-value data."""
        redis_connection = self.get_connection()
        return redis_connection.set(key, value)

    def get(self, key: str) -> Any:
        """Define method to get a key-value data by key."""
        redis_connection = self.get_connection()
        return redis_connection.get(key)

    def set_expire(self, key: str, expire_time: int, value: Any) -> Union[Awaitable[None], Any]:
        """Define method to set data with expiring time."""
        redis_connection = self.get_connection()
        return redis_connection.setex(key, expire_time, value)

    def remove(self, key: str) -> Any:
        """Define method to remove a key-value data."""
        redis_connection = self.get_connection()
        return redis_connection.delete(key)
