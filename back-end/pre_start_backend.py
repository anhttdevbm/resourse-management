import logging

from sqlalchemy import create_engine
from sqlalchemy.orm import Session
from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

from app.core.db_url import build_database_url

logger = logging.getLogger(__name__)

max_tries = 60
wait_seconds = 1


@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
def init_database():
    try:
        url = build_database_url()
        engine = create_engine(url, pool_pre_ping=True)
        session = Session(engine)
        return session
    except Exception as e:
        logger.error(e)
        raise e


def main() -> None:
    logger.info("Initializing service")
    init_database()
    logger.info("Service finished initializing")


if __name__ == "__main__":
    main()
