"""doc."""
from datetime import datetime
from typing import Any, Dict, List, Optional, Union

from pydantic import BaseModel, Field


class ExceptionDetail(BaseModel):
    """Define ExceptionDetail object."""

    code: str = Field(description="Exception Code")
    message: str = Field(description="Exception Message", default="success")
    data: Optional[Union[List[Any], Dict[str, Any], str]] = Field(description="Detail Exception Message", default=None)


class ResponseObject(ExceptionDetail):
    """Define response object."""

    links: Union[List[Any], Dict[str, Any], str] = Field(description="links", default=None)
    relationships: Union[List[Any], Dict[str, Any], str] = Field(description="relationships", default=None)
    timestamp: str = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
