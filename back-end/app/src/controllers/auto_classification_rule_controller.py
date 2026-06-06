"""API quy tắc phân loại tự động."""
import uuid
from typing import Tuple

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.src.controllers.auth_controller import user_service
from app.src.models import User
from app.src.schemas.auto_classification_rule import (
    AutoClassificationRuleBulkReplace,
    AutoClassificationRuleCreate,
    AutoClassificationRuleReorder,
    AutoClassificationRuleUpdate,
)
from app.src.schemas.response import ResponseObject
from app.src.services.auto_classification_rule_service import AutoClassificationRuleService
from app.src.utils.connection.sql_connection import get_db_session

auto_classification_rule_service = AutoClassificationRuleService()

auto_classification_routers = APIRouter()


@auto_classification_routers.get("/auto_classification_rules")
def list_auto_classification_rules(
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Danh sách quy tắc của user, sort_order tăng dần."""
    data = auto_classification_rule_service.list_for_user(db_session, user[0].id)
    return ResponseObject(data=data, code="BE0000")


@auto_classification_routers.post("/auto_classification_rules")
def create_auto_classification_rule(
    body: AutoClassificationRuleCreate,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Tạo quy tắc."""
    row = auto_classification_rule_service.create(db_session, user[0].id, body)
    return ResponseObject(data=auto_classification_rule_service.rule_to_dict(row), code="BE0000")


@auto_classification_routers.put("/auto_classification_rules/reorder")
def reorder_auto_classification_rules(
    body: AutoClassificationRuleReorder,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Cập nhật thứ tự (đủ mọi id hiện có)."""
    data = auto_classification_rule_service.reorder(db_session, user[0].id, body)
    return ResponseObject(data=data, code="BE0000")


@auto_classification_routers.post("/auto_classification_rules/bulk_replace")
def bulk_replace_auto_classification_rules(
    body: AutoClassificationRuleBulkReplace,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Xóa mềm toàn bộ quy tắc của user và tạo lại theo danh sách (nhập JSON / đồng bộ)."""
    data = auto_classification_rule_service.bulk_replace(db_session, user[0].id, body)
    return ResponseObject(data=data, code="BE0000")


@auto_classification_routers.get("/auto_classification_rules/{rule_id}")
def get_auto_classification_rule(
    rule_id: str,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Chi tiết một quy tắc."""
    rid = uuid.UUID(rule_id)
    row = auto_classification_rule_service.get_owned(db_session, rid, user[0].id)
    return ResponseObject(data=auto_classification_rule_service.rule_to_dict(row), code="BE0000")


@auto_classification_routers.put("/auto_classification_rules/{rule_id}")
def update_auto_classification_rule(
    rule_id: str,
    body: AutoClassificationRuleUpdate,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Cập nhật quy tắc."""
    rid = uuid.UUID(rule_id)
    row = auto_classification_rule_service.update(db_session, user[0].id, rid, body)
    return ResponseObject(data=auto_classification_rule_service.rule_to_dict(row), code="BE0000")


@auto_classification_routers.delete("/auto_classification_rules/{rule_id}")
def delete_auto_classification_rule(
    rule_id: str,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Xóa mềm quy tắc."""
    rid = uuid.UUID(rule_id)
    auto_classification_rule_service.delete(db_session, user[0].id, rid)
    return ResponseObject(message="Delete auto classification rule success", code="BE0000")
