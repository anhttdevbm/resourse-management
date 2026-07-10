"""Service: quy tắc phân loại tự động (per user)."""
import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy.orm import Session

from app.src import models
from app.src.exceptions.error_code import BEErrorCode
from app.src.repositories.auto_classification_rule import AutoClassificationRuleRepository
from app.src.schemas.auto_classification_rule import (
    AutoClassificationRuleBulkReplace,
    AutoClassificationRuleCreate,
    AutoClassificationRuleReorder,
    AutoClassificationRuleUpdate,
)


def _as_uuid(s: Optional[str]) -> Optional[uuid.UUID]:
    if s is None or s == "":
        return None
    return uuid.UUID(str(s))


_ASSIGN_KEYS = (
    "assign_stage_id",
    "assign_product_type_id",
    "assign_platform_id",
    "assign_tag_id",
    "assign_status_id",
    "assign_repo_id",
)


class AutoClassificationRuleService:
    """CRUD, reorder, bulk_replace."""

    def __init__(self) -> None:
        self.repo = AutoClassificationRuleRepository(models.AutoClassificationRule)

    def rule_to_dict(
        self,
        r: models.AutoClassificationRule,
        *,
        enabled_override: Optional[bool] = None,
    ) -> Dict[str, Any]:
        enabled = r.enabled if enabled_override is None else enabled_override
        return {
            "id": str(r.id),
            "user_id": str(r.user_id) if r.user_id else None,
            "is_system": bool(getattr(r, "is_system", False)),
            "sort_order": r.sort_order,
            "enabled": enabled,
            "title": r.title,
            "match_field": r.match_field,
            "match_op": r.match_op,
            "pattern": r.pattern,
            "assign_stage_id": str(r.assign_stage_id) if r.assign_stage_id else None,
            "assign_product_type_id": str(r.assign_product_type_id) if r.assign_product_type_id else None,
            "assign_platform_id": str(r.assign_platform_id) if r.assign_platform_id else None,
            "assign_tag_id": str(r.assign_tag_id) if r.assign_tag_id else None,
            "assign_status_id": str(r.assign_status_id) if r.assign_status_id else None,
            "assign_repo_id": str(r.assign_repo_id) if r.assign_repo_id else None,
            "created_at": r.created_at.isoformat() if r.created_at else None,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        }

    def _validate_assignment_strings(
        self,
        session: Session,
        user_id: uuid.UUID,
        *,
        assign_stage_id: Optional[str] = None,
        assign_product_type_id: Optional[str] = None,
        assign_platform_id: Optional[str] = None,
        assign_tag_id: Optional[str] = None,
        assign_status_id: Optional[str] = None,
        assign_repo_id: Optional[str] = None,
    ) -> None:
        uid = user_id
        if assign_stage_id:
            sid = _as_uuid(assign_stage_id)
            row = (
                session.query(models.ResourceStage)
                .filter(models.ResourceStage.id == sid, models.ResourceStage.is_deleted.is_(False))
                .first()
            )
            if not row:
                raise BEErrorCode.RESOURCE_STAGE_NOT_FOUND.value
        if assign_product_type_id:
            pid = _as_uuid(assign_product_type_id)
            row = (
                session.query(models.ProductType)
                .filter(models.ProductType.id == pid, models.ProductType.is_deleted.is_(False))
                .first()
            )
            if not row:
                raise BEErrorCode.PRODUCE_NOT_FOUND.value
        if assign_platform_id:
            pid = _as_uuid(assign_platform_id)
            row = (
                session.query(models.ResourcePlatform)
                .filter(models.ResourcePlatform.id == pid, models.ResourcePlatform.is_deleted.is_(False))
                .first()
            )
            if not row:
                raise BEErrorCode.RESOURCE_PLATFORM_NOT_FOUND.value
        if assign_status_id:
            sid = _as_uuid(assign_status_id)
            row = (
                session.query(models.ResourceStatus)
                .filter(models.ResourceStatus.id == sid, models.ResourceStatus.is_deleted.is_(False))
                .first()
            )
            if not row:
                raise BEErrorCode.RESOURCE_STATUS_NOT_FOUND.value
        if assign_tag_id:
            tid = _as_uuid(assign_tag_id)
            row = (
                session.query(models.ResourceTag)
                .filter(
                    models.ResourceTag.id == tid,
                    models.ResourceTag.user_id == uid,
                    models.ResourceTag.is_deleted.is_(False),
                )
                .first()
            )
            if not row:
                raise BEErrorCode.RESOURCE_TAG_NOT_FOUND.value
        if assign_repo_id:
            rid = _as_uuid(assign_repo_id)
            row = (
                session.query(models.PackageRepository)
                .filter(
                    models.PackageRepository.id == rid,
                    models.PackageRepository.user_id == uid,
                    models.PackageRepository.is_deleted.is_(False),
                )
                .first()
            )
            if not row:
                raise BEErrorCode.PACKAGE_REPOSITORY_NOT_FOUND.value

    def list_for_user(self, session: Session, user_id: uuid.UUID) -> List[Dict[str, Any]]:
        overrides = self.repo.get_user_overrides(session, user_id)
        rows = self.repo.get_system_rules(session) + self.repo.get_all_by_user(session, user_id)
        out: List[Dict[str, Any]] = []
        for r in rows:
            override = overrides.get(r.id) if getattr(r, "is_system", False) else None
            out.append(self.rule_to_dict(r, enabled_override=override))
        return out

    def set_enabled(
        self, session: Session, user_id: uuid.UUID, rule_id: uuid.UUID, enabled: bool
    ) -> Dict[str, Any]:
        """Bật/tắt rule: user rule sửa trực tiếp; system rule ghi override per-user."""
        r = self.repo.get(session, rule_id)
        if not r or r.is_deleted:
            raise BEErrorCode.AUTO_CLASSIFICATION_RULE_NOT_FOUND.value

        if getattr(r, "is_system", False):
            row = (
                session.query(models.AutoClassificationRuleOverride)
                .filter(
                    models.AutoClassificationRuleOverride.user_id == user_id,
                    models.AutoClassificationRuleOverride.rule_id == rule_id,
                )
                .first()
            )
            if row:
                row.enabled = enabled
            else:
                session.add(
                    models.AutoClassificationRuleOverride(
                        user_id=user_id,
                        rule_id=rule_id,
                        enabled=enabled,
                    )
                )
            session.commit()
            return self.rule_to_dict(r, enabled_override=enabled)

        owned = self.get_owned(session, rule_id, user_id)
        self.repo.update(session, obj_id=owned.id, obj_in={"enabled": enabled})
        out = self.repo.get(session, rule_id)
        if not out:
            raise BEErrorCode.AUTO_CLASSIFICATION_RULE_NOT_FOUND.value
        return self.rule_to_dict(out)

    def get_owned(self, session: Session, rule_id: uuid.UUID, user_id: uuid.UUID) -> models.AutoClassificationRule:
        r = self.repo.get(session, rule_id)
        if not r:
            raise BEErrorCode.AUTO_CLASSIFICATION_RULE_NOT_FOUND.value
        if getattr(r, "is_system", False):
            raise BEErrorCode.USER_NOT_PERMISSION.value
        if str(r.user_id) != str(user_id):
            raise BEErrorCode.AUTO_CLASSIFICATION_RULE_NOT_FOUND.value
        return r

    def create(self, session: Session, user_id: uuid.UUID, body: AutoClassificationRuleCreate) -> models.AutoClassificationRule:
        self._validate_assignment_strings(
            session,
            user_id,
            assign_stage_id=body.assign_stage_id,
            assign_product_type_id=body.assign_product_type_id,
            assign_platform_id=body.assign_platform_id,
            assign_tag_id=body.assign_tag_id,
            assign_status_id=body.assign_status_id,
            assign_repo_id=body.assign_repo_id,
        )
        obj_in: Dict[str, Any] = {
            "user_id": user_id,
            "sort_order": body.sort_order,
            "enabled": body.enabled,
            "title": body.title.strip(),
            "match_field": body.match_field,
            "match_op": body.match_op,
            "pattern": body.pattern.strip(),
            "assign_stage_id": _as_uuid(body.assign_stage_id),
            "assign_product_type_id": _as_uuid(body.assign_product_type_id),
            "assign_platform_id": _as_uuid(body.assign_platform_id),
            "assign_tag_id": _as_uuid(body.assign_tag_id),
            "assign_status_id": _as_uuid(body.assign_status_id),
            "assign_repo_id": _as_uuid(body.assign_repo_id),
            "is_deleted": False,
        }
        return self.repo.create(session, obj_in=obj_in)  # type: ignore[arg-type]

    def update(
        self, session: Session, user_id: uuid.UUID, rule_id: uuid.UUID, body: AutoClassificationRuleUpdate
    ) -> models.AutoClassificationRule:
        data = body.dict(exclude_unset=True)
        if set(data.keys()) == {"enabled"}:
            self.set_enabled(session, user_id, rule_id, bool(data["enabled"]))
            out = self.repo.get(session, rule_id)
            if not out:
                raise BEErrorCode.AUTO_CLASSIFICATION_RULE_NOT_FOUND.value
            return out

        _ = self.get_owned(session, rule_id, user_id)
        fk_check: Dict[str, Optional[str]] = {}
        for k in _ASSIGN_KEYS:
            if k in data:
                v = data[k]
                fk_check[k] = v if v else None
        if fk_check:
            self._validate_assignment_strings(session, user_id, **{  # type: ignore[arg-type]
                "assign_stage_id": fk_check.get("assign_stage_id"),
                "assign_product_type_id": fk_check.get("assign_product_type_id"),
                "assign_platform_id": fk_check.get("assign_platform_id"),
                "assign_tag_id": fk_check.get("assign_tag_id"),
                "assign_status_id": fk_check.get("assign_status_id"),
                "assign_repo_id": fk_check.get("assign_repo_id"),
            })
        upd: Dict[str, Any] = {}
        for k, v in data.items():
            if k in _ASSIGN_KEYS:
                upd[k] = _as_uuid(v) if v else None
            elif k == "title" and isinstance(v, str):
                upd[k] = v.strip()
            elif k == "pattern" and isinstance(v, str):
                upd[k] = v.strip()
            else:
                upd[k] = v
        if not upd:
            return self.repo.get(session, rule_id)  # type: ignore[return-value]
        self.repo.update(session, obj_id=rule_id, obj_in=upd)
        out = self.repo.get(session, rule_id)
        if not out:
            raise BEErrorCode.AUTO_CLASSIFICATION_RULE_NOT_FOUND.value
        return out

    def delete(self, session: Session, user_id: uuid.UUID, rule_id: uuid.UUID) -> None:
        _ = self.get_owned(session, rule_id, user_id)
        self.repo.delete(session, obj_id=rule_id)

    def reorder(
        self, session: Session, user_id: uuid.UUID, body: AutoClassificationRuleReorder
    ) -> List[Dict[str, Any]]:
        existing = self.repo.get_all_by_user(session, user_id)
        existing_ids = {str(r.id) for r in existing}
        incoming = list(body.ordered_ids)
        if len(incoming) != len(existing_ids) or set(incoming) != existing_ids:
            raise BEErrorCode.AUTO_CLASSIFICATION_REORDER_INVALID.value
        for order, rid in enumerate(incoming):
            self.repo.update(session, obj_id=uuid.UUID(str(rid)), obj_in={"sort_order": order})
        return self.list_for_user(session, user_id)

    def bulk_replace(
        self, session: Session, user_id: uuid.UUID, body: AutoClassificationRuleBulkReplace
    ) -> List[Dict[str, Any]]:
        try:
            session.query(models.AutoClassificationRule).filter(
                models.AutoClassificationRule.user_id == user_id,
                models.AutoClassificationRule.is_system.is_(False),
                models.AutoClassificationRule.is_deleted.is_(False),
            ).update({"is_deleted": True}, synchronize_session=False)
            for i, item in enumerate(body.rules):
                self._validate_assignment_strings(
                    session,
                    user_id,
                    assign_stage_id=item.assign_stage_id,
                    assign_product_type_id=item.assign_product_type_id,
                    assign_platform_id=item.assign_platform_id,
                    assign_tag_id=item.assign_tag_id,
                    assign_status_id=item.assign_status_id,
                    assign_repo_id=item.assign_repo_id,
                )
                row = models.AutoClassificationRule(
                    user_id=user_id,
                    sort_order=i,
                    enabled=item.enabled,
                    title=item.title.strip(),
                    match_field=item.match_field,
                    match_op=item.match_op,
                    pattern=item.pattern.strip(),
                    assign_stage_id=_as_uuid(item.assign_stage_id),
                    assign_product_type_id=_as_uuid(item.assign_product_type_id),
                    assign_platform_id=_as_uuid(item.assign_platform_id),
                    assign_tag_id=_as_uuid(item.assign_tag_id),
                    assign_status_id=_as_uuid(item.assign_status_id),
                    assign_repo_id=_as_uuid(item.assign_repo_id),
                    is_deleted=False,
                )
                session.add(row)
            session.commit()
        except Exception:
            session.rollback()
            raise
        return self.list_for_user(session, user_id)
