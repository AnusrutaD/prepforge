from typing import Generic, TypeVar, Optional
from datetime import datetime, timezone
from pydantic import BaseModel, Field

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    message: Optional[str] = None
    error_code: Optional[str] = None
    timestamp: datetime = Field(
        default_factory=lambda: datetime.now(timezone.utc)
    )

    @classmethod
    def ok(cls, data: T) -> "ApiResponse[T]":
        return cls(success=True, data=data)

    @classmethod
    def error(cls, message: str, error_code: str) -> "ApiResponse[None]":
        return cls(success=False, message=message, error_code=error_code)
