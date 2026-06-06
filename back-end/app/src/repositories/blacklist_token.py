
"""doc."""
import logging

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import ServerErrorCode
from app.src.repositories.base_sql import BaseSQLRepository


class BlackListTokenRepository(BaseSQLRepository[models.BlacklistToken]):
    """doc."""

    def is_black_token(self, session: Session, token: str) -> bool:
        """Define method check black list token."""
        try:
            if session.query(self.model).filter(self.model.token == token).first():
                return True
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)
        logging.debug(f"Get token has token={token} from table BLACKLIST_TOKENS done")
        return False
