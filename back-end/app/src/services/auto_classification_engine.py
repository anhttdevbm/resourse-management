"""Áp dụng quy tắc phân loại tự động khi upload."""
from __future__ import annotations

import re
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.src import models
from app.src.repositories.auto_classification_rule import AutoClassificationRuleRepository

_ASSIGN_FIELDS = (
    ("assign_stage_id", "stage_id"),
    ("assign_product_type_id", "product_type_id"),
    ("assign_platform_id", "platform_id"),
    ("assign_status_id", "status_id"),
    ("assign_repo_id", "repo_id"),
)


def file_extension_from_filename(filename: str) -> str:
    name = (filename or "").strip()
    if not name or "." not in name:
        return ""
    return name.rsplit(".", 1)[-1].lower()


def _rule_matches(rule: models.AutoClassificationRule, *, name: str, extension: str) -> bool:
    pattern = (rule.pattern or "").strip()
    if not pattern:
        return False
    haystack_raw = extension if rule.match_field == "extension" else name
    if rule.match_op == "regex":
        try:
            return bool(re.search(pattern, haystack_raw, re.IGNORECASE))
        except re.error:
            return False
    hay = haystack_raw.lower()
    needle = pattern.lower()
    if rule.match_op == "contains":
        return needle in hay
    if rule.match_op == "startsWith":
        return hay.startswith(needle)
    if rule.match_op == "endsWith":
        return hay.endswith(needle)
    if rule.match_op == "equals":
        return hay == needle
    return False


def pick_first_matching_rule(
    rules: List[models.AutoClassificationRule],
    *,
    name: str,
    extension: str,
) -> Optional[models.AutoClassificationRule]:
    for rule in rules:
        if not rule.enabled:
            continue
        if _rule_matches(rule, name=name, extension=extension):
            return rule
    return None


def apply_rule_to_payload(
    rule: models.AutoClassificationRule,
    payload: Dict[str, Any],
    *,
    only_fill_empty: bool = True,
) -> Optional[str]:
    """Gán metadata từ rule vào payload upload. Trả về tag_id nếu có."""
    for assign_attr, payload_key in _ASSIGN_FIELDS:
        value = getattr(rule, assign_attr, None)
        if not value:
            continue
        if only_fill_empty and payload.get(payload_key):
            continue
        payload[payload_key] = str(value)

    tag_id = getattr(rule, "assign_tag_id", None)
    if tag_id and (not only_fill_empty or not payload.get("tag_id")):
        return str(tag_id)
    return None


def get_effective_rules(session: Session, user_id: uuid.UUID) -> List[models.AutoClassificationRule]:
    repo = AutoClassificationRuleRepository(models.AutoClassificationRule)
    return repo.get_effective_rules(session, user_id)


def apply_auto_classification(
    session: Session,
    user_id: uuid.UUID,
    payload: Dict[str, Any],
    *,
    filename: str,
    only_fill_empty: bool = True,
) -> Optional[str]:
    """Áp dụng quy tắc hệ thống + quy tắc user. Trả về tag_id cần gán sau khi tạo resource."""
    rules = get_effective_rules(session, user_id)
    if not rules:
        return None
    resource_name = str(payload.get("name") or "")
    extension = file_extension_from_filename(filename)
    matched = pick_first_matching_rule(rules, name=resource_name, extension=extension)
    if not matched:
        return None
    return apply_rule_to_payload(matched, payload, only_fill_empty=only_fill_empty)
