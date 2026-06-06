"""Schemas cho quy tắc phân loại tự động."""
from typing import List, Optional

from pydantic import BaseModel, Field, validator

_ALLOWED_MATCH_FIELDS = frozenset({"name", "extension"})
_ALLOWED_MATCH_OPS = frozenset({"contains", "startsWith", "endsWith", "equals", "regex"})


class AutoClassificationRuleCreate(BaseModel):
    """Tạo một quy tắc."""

    title: str = Field(..., min_length=1, max_length=255)
    match_field: str
    match_op: str
    pattern: str = Field(..., min_length=1, max_length=512)
    enabled: bool = True
    sort_order: int = Field(0, ge=0, le=100_000)
    assign_stage_id: Optional[str] = None
    assign_product_type_id: Optional[str] = None
    assign_platform_id: Optional[str] = None
    assign_tag_id: Optional[str] = None
    assign_status_id: Optional[str] = None
    assign_repo_id: Optional[str] = None

    @validator("match_field")
    def validate_match_field(cls, v: str) -> str:
        if v not in _ALLOWED_MATCH_FIELDS:
            raise ValueError("match_field must be name or extension")
        return v

    @validator("match_op")
    def validate_match_op(cls, v: str) -> str:
        if v not in _ALLOWED_MATCH_OPS:
            raise ValueError("invalid match_op")
        return v

    class Config:
        from_attributes = True


class AutoClassificationRuleUpdate(BaseModel):
    """Cập nhật từng phần."""

    title: Optional[str] = Field(None, min_length=1, max_length=255)
    match_field: Optional[str] = None
    match_op: Optional[str] = None
    pattern: Optional[str] = Field(None, min_length=1, max_length=512)
    enabled: Optional[bool] = None
    sort_order: Optional[int] = Field(None, ge=0, le=100_000)
    assign_stage_id: Optional[str] = None
    assign_product_type_id: Optional[str] = None
    assign_platform_id: Optional[str] = None
    assign_tag_id: Optional[str] = None
    assign_status_id: Optional[str] = None
    assign_repo_id: Optional[str] = None

    @validator("match_field")
    def validate_match_field(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in _ALLOWED_MATCH_FIELDS:
            raise ValueError("match_field must be name or extension")
        return v

    @validator("match_op")
    def validate_match_op(cls, v: Optional[str]) -> Optional[str]:
        if v is not None and v not in _ALLOWED_MATCH_OPS:
            raise ValueError("invalid match_op")
        return v

    class Config:
        from_attributes = True


class AutoClassificationRuleReorder(BaseModel):
    """Thứ tự mới — đủ mọi id quy tắc của user, không trùng không thiếu."""

    ordered_ids: List[str] = Field(default_factory=list)


class AutoClassificationRuleBulkItem(BaseModel):
    """Một dòng trong thay thế hàng loạt (không có id — server tạo mới)."""

    title: str = Field(..., min_length=1, max_length=255)
    match_field: str
    match_op: str
    pattern: str = Field(..., min_length=1, max_length=512)
    enabled: bool = True
    assign_stage_id: Optional[str] = None
    assign_product_type_id: Optional[str] = None
    assign_platform_id: Optional[str] = None
    assign_tag_id: Optional[str] = None
    assign_status_id: Optional[str] = None
    assign_repo_id: Optional[str] = None

    @validator("match_field")
    def validate_match_field(cls, v: str) -> str:
        if v not in _ALLOWED_MATCH_FIELDS:
            raise ValueError("match_field must be name or extension")
        return v

    @validator("match_op")
    def validate_match_op(cls, v: str) -> str:
        if v not in _ALLOWED_MATCH_OPS:
            raise ValueError("invalid match_op")
        return v

    class Config:
        from_attributes = True


class AutoClassificationRuleBulkReplace(BaseModel):
    """Xóa mềm toàn bộ quy tắc của user và tạo lại theo danh sách (thứ tự = sort_order)."""

    rules: List[AutoClassificationRuleBulkItem] = Field(default_factory=list)
