"""Notification endpoints."""
from __future__ import annotations

import asyncio
import secrets
import time
from typing import Dict, Tuple
from uuid import UUID

from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.src.exceptions.error_code import AuthErrorCode
from app.src.models import User
from app.src.schemas.notification import NotificationCreate
from app.src.schemas.response import ResponseObject
from app.src.services.notification_service import NotificationService
from app.src.services.user_service import UserService
from app.src.utils.connection.sql_connection import get_db_session
from app.src.utils.deps_permissions import require_admin_user
from app.src.utils.notification_channel import subscribe_notification_channel

notification_router = APIRouter()
notification_service = NotificationService()
user_service = UserService()

# One-time short-lived SSE tickets: ticket -> (user_id, expires_at)
_STREAM_TICKETS: Dict[str, Tuple[str, float]] = {}
_STREAM_TICKET_TTL_SECONDS = 60


def _extract_user(user_data: Tuple[User, str]) -> User:
    user, _ = user_data
    return user


def _cleanup_expired_tickets() -> None:
    now = time.time()
    expired = [k for k, (_, exp) in _STREAM_TICKETS.items() if exp <= now]
    for key in expired:
        _STREAM_TICKETS.pop(key, None)


@notification_router.get("/notifications")
def list_notifications(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=50),
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Paginated notifications for current user."""
    user = _extract_user(current_user)
    page_data = notification_service.get_user_notifications(db_session, user.id, page, page_size)
    return ResponseObject(data=page_data.dict(), code="NOTI0000")


@notification_router.post("/notifications")
def create_notification(
    payload: NotificationCreate,
    db_session: Session = Depends(get_db_session),
    admin_user: User = Depends(require_admin_user),
) -> ResponseObject:
    """Create notification(s) — admin only (prevents spam to arbitrary users)."""
    created = notification_service.create_notifications(db_session, admin_user.id, payload)
    serialized = [item.dict() for item in created]
    return ResponseObject(data=serialized, code="NOTI0001")


@notification_router.post("/notifications/stream-ticket")
def create_stream_ticket(
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Issue a short-lived one-time ticket for SSE (avoids putting JWT in query string)."""
    _cleanup_expired_tickets()
    user = _extract_user(current_user)
    ticket = secrets.token_urlsafe(32)
    _STREAM_TICKETS[ticket] = (str(user.id), time.time() + _STREAM_TICKET_TTL_SECONDS)
    return ResponseObject(
        data={"ticket": ticket, "expires_in": _STREAM_TICKET_TTL_SECONDS},
        code="NOTI0004",
    )


@notification_router.patch("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: UUID,
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Mark a single notification as read."""
    user = _extract_user(current_user)
    item = notification_service.mark_notification_read(db_session, notification_id, user.id)
    return ResponseObject(data=item.dict(), code="NOTI0002")


@notification_router.patch("/notifications/read-all")
def mark_all_as_read(
    db_session: Session = Depends(get_db_session),
    current_user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Mark all notifications for current user as read."""
    user = _extract_user(current_user)
    affected = notification_service.mark_all_read(db_session, user.id)
    return ResponseObject(data={"updated": affected}, code="NOTI0003")


@notification_router.get("/notifications/stream")
async def notification_stream(
    ticket: str = Query(..., description="One-time SSE ticket from POST /notifications/stream-ticket"),
):
    """Server-Sent Events stream authenticated via short-lived ticket (not JWT)."""
    _cleanup_expired_tickets()
    entry = _STREAM_TICKETS.pop(ticket, None)
    if not entry:
        raise AuthErrorCode.INVALID_ACCESS_TOKEN.value
    user_id, expires_at = entry
    if expires_at <= time.time():
        raise AuthErrorCode.INVALID_ACCESS_TOKEN.value

    async def event_generator(uid: str):
        pubsub = None
        channel = None
        try:
            pubsub, channel = await subscribe_notification_channel(uid)
            yield ":connected\n\n"

            while True:
                try:
                    message = await pubsub.get_message(ignore_subscribe_messages=True, timeout=15.0)
                    if message and message["type"] == "message":
                        yield f"data: {message['data']}\n\n"
                    else:
                        yield ":keep-alive\n\n"
                        await asyncio.sleep(10)
                except asyncio.TimeoutError:
                    yield ":keep-alive\n\n"
                    continue
                except Exception as e:
                    print(f"Error in notification stream: {str(e)}")
                    yield f"event: error\ndata: {str(e)}\n\n"
                    await asyncio.sleep(5)
                    try:
                        if pubsub:
                            await pubsub.close()
                    except Exception:
                        pass
                    pubsub, channel = await subscribe_notification_channel(uid)
        except Exception as e:
            print(f"Fatal error in notification stream: {str(e)}")
            yield "event: error\ndata: Connection error\n\n"
        finally:
            try:
                if pubsub and channel:
                    await pubsub.unsubscribe(channel)
                    await pubsub.close()
            except Exception as e:
                print(f"Error closing pubsub: {str(e)}")

    response = StreamingResponse(event_generator(user_id), media_type="text/event-stream")
    response.headers["Cache-Control"] = "no-cache"
    response.headers["Connection"] = "keep-alive"
    response.headers["X-Accel-Buffering"] = "no"
    return response
