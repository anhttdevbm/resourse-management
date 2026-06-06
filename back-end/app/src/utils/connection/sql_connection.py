"""Define SQL connection."""
from typing import Generator

import decouple
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

engine = create_engine(
    f"postgresql://{decouple.config('USERNAME_DB')}:{decouple.config('PASSWORD_DB')}@"
    f"{decouple.config('HOST_DB')}/{decouple.config('NAME_DB')}",
    pool_pre_ping=True,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db_session() -> Generator[Session, None, None]:
    """doc."""
    session = SessionLocal()
    try:
        yield session
    finally:
        session.close()
