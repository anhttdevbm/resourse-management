"""Define base service."""
import decouple

from app.src.services.postgres_connector import PostgreSQLDB
from app.src.services.s3_connection import S3Storage


class BaseService:
    """Define base service."""

    def __init__(self) -> None:
        """Define base service."""
        self.engine_s3 = S3Storage(decouple.config("AWS_HOST", None),
                                   decouple.config("AWS_ACCESS_KEY_ID", None),
                                   decouple.config("AWS_SECRET_ACCESS_KEY", None),
                                   decouple.config("AWS_BUCKET_NAME", ""),
                                   decouple.config("AWS_REGION", None))
        self.engine_postgresql = PostgreSQLDB()