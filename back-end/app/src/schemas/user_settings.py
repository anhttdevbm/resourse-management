"""Cài đặt người dùng (lưu JSONB trên bảng users)."""
from typing import Any, Dict, Optional

from pydantic import BaseModel, Field, validator


class UserSettingsUpdate(BaseModel):
    """PATCH một phần — chỉ gửi trường cần đổi."""

    theme: Optional[str] = None
    locale: Optional[str] = None
    dense_ui: Optional[bool] = None
    default_page_size: Optional[int] = Field(None, ge=10, le=100)
    show_dashboard_tips: Optional[bool] = None
    notify_resource_updates: Optional[bool] = None

    @validator("theme")
    def validate_theme(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ("light", "dark", "system"):
            raise ValueError("theme must be light, dark, or system")
        return v

    @validator("locale")
    def validate_locale(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        if v not in ("vi", "en"):
            raise ValueError("locale must be vi or en")
        return v

    class Config:
        from_attributes = True


def default_user_settings() -> Dict[str, Any]:
    """Giá trị mặc định khi chưa có hoặc thiếu khóa."""
    return {
        "theme": "light",
        "locale": "vi",
        "dense_ui": False,
        "default_page_size": 20,
        "show_dashboard_tips": True,
        "notify_resource_updates": True,
    }
