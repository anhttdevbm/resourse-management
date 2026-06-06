"""Define pre start backend."""
import logging

import bcrypt
import decouple
from pymongo import MongoClient
from pymongo.database import Database
from tenacity import after_log, before_log, retry, stop_after_attempt, wait_fixed

logger = logging.getLogger(__name__)

max_tries = 60
wait_seconds = 1


@retry(
    stop=stop_after_attempt(max_tries),
    wait=wait_fixed(wait_seconds),
    before=before_log(logger, logging.INFO),
    after=after_log(logger, logging.WARN),
)
def init_database() -> Database:
    """Define init database."""
    try:
        client = MongoClient(host=decouple.config("MONGO_HOST"), port=int(decouple.config("MONGO_PORT")),
                             username=decouple.config("MONGO_USERNAME"), password=decouple.config("MONGO_PASSWORD"))
        database = client.get_database(decouple.config("MONGO_DATABASE"))
        logger.info(database['info'].find_one())
        return database
    except Exception as e:
        logger.error(e)
        raise e


def init_data(db: Database) -> None:
    """Define init data."""
    email = decouple.config("FIRST_SUPERUSER")
    user = db['user'].find_one({"email": email})
    if not user:
        password_hash = bcrypt.hashpw(decouple.config("SUPERUSER_PASSWORD").encode('utf-8'), bcrypt.gensalt()).decode()
        db['user'].insert_one({"email": email,
                               "password": password_hash})


def main() -> None:
    """Define main."""
    logger.info("Initializing service")
    database = init_database()
    logger.info("Service finished initializing")
    logger.info("Creating initial data")
    init_data(database)
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
