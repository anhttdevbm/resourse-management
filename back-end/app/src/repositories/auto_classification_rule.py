"""Repository cho auto_classification_rules."""
import uuid
from typing import Dict, List

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import ServerErrorCode
from app.src.repositories.base_sql import BaseSQLRepository


class AutoClassificationRuleRepository(BaseSQLRepository[models.AutoClassificationRule]):
    """CRUD + list theo user."""

    def get_all_by_user(self, session: Session, user_id: uuid.UUID) -> List[models.AutoClassificationRule]:
        """Quy tắc riêng của user (không gồm quy tắc hệ thống), sort_order tăng dần."""
        try:
            return (
                session.query(self.model)
                .filter(
                    self.model.user_id == user_id,
                    self.model.is_deleted.is_(False),
                    self.model.is_system.is_(False),
                )
                .order_by(self.model.sort_order.asc(), self.model.created_at.asc())
                .all()
            )
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)

    def get_system_rules(self, session: Session) -> List[models.AutoClassificationRule]:
        """Quy tắc hệ thống áp dụng cho mọi user."""
        try:
            return (
                session.query(self.model)
                .filter(self.model.is_system.is_(True), self.model.is_deleted.is_(False))
                .order_by(self.model.sort_order.asc(), self.model.created_at.asc())
                .all()
            )
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)

    def get_user_overrides(self, session: Session, user_id: uuid.UUID) -> Dict[uuid.UUID, bool]:
        """Map rule_id → enabled theo override của user."""
        try:
            rows = (
                session.query(models.AutoClassificationRuleOverride)
                .filter(models.AutoClassificationRuleOverride.user_id == user_id)
                .all()
            )
            return {row.rule_id: bool(row.enabled) for row in rows}
        except SQLAlchemyError as ex:
            raise ServerErrorCode.DATABASE_ERROR.value(ex)

    def get_effective_rules(self, session: Session, user_id: uuid.UUID) -> List[models.AutoClassificationRule]:
        """Hệ thống trước (đã lọc theo override), quy tắc user sau — first-match."""
        overrides = self.get_user_overrides(session, user_id)
        system: List[models.AutoClassificationRule] = []
        for rule in self.get_system_rules(session):
            if rule.id in overrides:
                if not overrides[rule.id]:
                    continue
            elif not rule.enabled:
                continue
            system.append(rule)
        user_rules = [r for r in self.get_all_by_user(session, user_id) if r.enabled]
        return system + user_rules
