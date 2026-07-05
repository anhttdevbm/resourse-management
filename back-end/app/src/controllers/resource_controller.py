"""Define resource controller."""
import logging
import os
from typing import List, Optional, Tuple

from fastapi import APIRouter, Depends, File, Form, UploadFile, HTTPException, Query
from sqlalchemy.orm import Session
from starlette.responses import FileResponse

from app.src import models
from app.src.controllers.auth_controller import user_service
from app.src.models import User
from app.src.schemas.resource import ResourceCreate, ResourceUpdate
from app.src.schemas.resource import ResourceGet
from app.src.schemas.resource_share import ResourceShareCreate
from app.src.schemas.response import ResponseObject
from app.src.exceptions.error_code import BEErrorCode, ServerErrorCode
from app.src.exceptions.exception import BusinessException
from app.src.services.resource_service import ResourceService
from app.src.utils.common import row2dict
from app.src.utils.connection.sql_connection import get_db_session

resource_service = ResourceService()
logger = logging.getLogger(__name__)

resource_routers = APIRouter()


def _enrich_resource(resource: models.Resource, db_session: Session) -> dict:
    """Serialize resource with related entities and owner info."""
    item = row2dict(resource)

    status = getattr(resource, "resource_status", None)
    if status:
        item["resource_status"] = {"id": str(status.id), "name": status.name}

    platform = getattr(resource, "resource_platform", None)
    if platform:
        item["resource_platform"] = {"id": str(platform.id), "name": platform.name}

    product_type = getattr(resource, "product_type", None)
    if product_type:
        item["product_type"] = {"id": str(product_type.id), "name": product_type.name}

    package_repo = getattr(resource, "package_repo", None)
    if package_repo:
        item["package_repo"] = {"id": str(package_repo.id), "name": package_repo.name}

    stage = getattr(resource, "resource_stage", None)
    if stage:
        item["resource_stage"] = {"id": str(stage.id), "name": stage.name}

    tags = getattr(resource, "resource_tags", None)
    if tags:
        item["resource_tags"] = [{"id": str(tag.id), "name": tag.name} for tag in tags]

    if resource.user_id:
        owner = db_session.query(models.User).filter(models.User.id == resource.user_id).first()
        if owner:
            item["owner"] = {
                "id": str(owner.id),
                "name": owner.name,
                "email": owner.email,
            }

    return item


@resource_routers.post('/', response_model=ResponseObject)
async def create_one(
    user: Tuple[User, str] = Depends(user_service.get_current_user),
    file_upload: UploadFile = File(...),
    name: str = Form(...),
    version: str = Form(...),
    stage_id: Optional[str] = Form(None),
    status_id: Optional[str] = Form(None),
    platform_id: Optional[str] = Form(None),
    product_type_id: Optional[str] = Form(None),
    repo_id: Optional[str] = Form(None),
    tag_id: Optional[str] = Form(None),
):
    """Define create one (multipart: file_upload + form fields)."""
    resource_create = ResourceCreate(
        name=name,
        version=version,
        stage_id=stage_id,
        status_id=status_id,
        platform_id=platform_id,
        product_type_id=product_type_id,
        repo_id=repo_id,
        tag_id=tag_id,
    )
    try:
        print(f"🔄 Uploading resource: {file_upload.filename}")
        result = await resource_service.upload_resource(file_upload, resource_create, user[0])
        print(f"✅ Upload successful: {result}")
        return ResponseObject(data=row2dict(result), code="BE0000", message="Upload successful")
    except Exception as e:
        print(f"❌ Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@resource_routers.put("/resources/{resource_id}")
def update_resource_stage(resource_id: str, resource_update: ResourceUpdate, db_session: Session = Depends(get_db_session) # noqa
                          , user: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject: # noqa
    """Update an existing resource."""
    try:
        data = resource_service.update(db_session, resource_id, resource_update, user[0])
        return ResponseObject(data=_enrich_resource(data, db_session), code="BE0000")
    except BusinessException:
        raise
    except Exception as exc:
        logger.exception("PUT /resources/%s failed: %s", resource_id, exc)
        raise ServerErrorCode.SERVER_ERROR.value(exc)


@resource_routers.get("/resources/{resource_id}")
def read_resource_by_id(
    resource_id: str,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Get resource by id, tôn trọng quyền share."""
    data = resource_service.get_with_permission(db_session, resource_id, user[0])
    return ResponseObject(data=_enrich_resource(data, db_session), code="BE0000")


@resource_routers.get("/resources/")
def get_resources(
    id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    version: Optional[str] = Query(None),
    stage_id: Optional[str] = Query(None),
    status_id: Optional[str] = Query(None),
    platform_id: Optional[str] = Query(None),
    product_type_id: Optional[str] = Query(None),
    repo_id: Optional[str] = Query(None),
    tag_id: Optional[str] = Query(None),
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user)
) -> ResponseObject:
    """Get resources based on filters."""
    # Build ResourceGet object from query parameters
    filters = ResourceGet(
        id=id,
        name=name,
        version=version,
        stage_id=stage_id,
        status_id=status_id,
        platform_id=platform_id,
        product_type_id=product_type_id,
        repo_id=repo_id,
        tag_id=tag_id
    )
    resources: List[models.Resource] = resource_service.search_resources(db_session, filters, user[0])

    enriched_resources = []
    for resource in resources:
      enriched_resources.append(_enrich_resource(resource, db_session))

    return ResponseObject(data=enriched_resources, code="BE0000")


@resource_routers.delete('/resource/{resource_id}')
def delete_resource(resource_id: str, db_session: Session = Depends(get_db_session),
                    user: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject:
    """Delete a resource (only owner)."""
    # Chỉ cho phép chủ tài nguyên xóa; kiểm tra trong service
    # (giữ nguyên signature delete để tránh phá vỡ code khác, nên kiểm tra owner ở đây)
    resource = resource_service.get(db_session, resource_id)
    if resource.user_id != user[0].id:
        raise BEErrorCode.USER_NOT_PERMISSION.value
    resource_service.delete(db_session, resource_id)
    return ResponseObject(message="Delete Resource Success", code="BE0000")


@resource_routers.delete('/resoures/{resource_id}')
def back_up_resource(resource_id: str, db_session: Session = Depends(get_db_session),
                     _: Tuple[User, str] = Depends(user_service.get_current_user)) -> ResponseObject:
    """Back up a resource."""
    resource_service.back_up(db_session, resource_id)
    return ResponseObject(message="Back Up Resource Success", code="BE0000")


@resource_routers.get('/download/')
def download_one(resource_id: str, db_session: Session = Depends(get_db_session),
                 user: Tuple[User, str] = Depends(user_service.get_current_user)):
    """Download resource."""
    file_path = resource_service.download_resource(db_session, resource_id, user[0])
    return FileResponse(file_path, media_type='application/octet-stream', filename=os.path.basename(file_path))


@resource_routers.post("/resources/{resource_id}/shares", response_model=ResponseObject)
def share_resource(
    resource_id: str,
    payload: ResourceShareCreate,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Share a resource with another user (owner only)."""
    share_info = resource_service.share_resource(db_session, resource_id, payload, user[0])
    return ResponseObject(data=share_info.dict(), code="BE0000")


@resource_routers.get("/resources/{resource_id}/shares", response_model=ResponseObject)
def list_resource_shares(
    resource_id: str,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """List all users that the resource is shared with (owner only)."""
    shares = resource_service.list_shares(db_session, resource_id, user[0])
    return ResponseObject(data=[s.dict() for s in shares], code="BE0000")


@resource_routers.delete("/resources/{resource_id}/shares/{target_user_id}", response_model=ResponseObject)
def remove_resource_share(
    resource_id: str,
    target_user_id: str,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Remove sharing for a specific user (owner only)."""
    import uuid

    resource_service.remove_share(db_session, resource_id, uuid.UUID(target_user_id), user[0])
    return ResponseObject(message="Remove share success", code="BE0000")


@resource_routers.get("/admin/resources/")
def admin_list_resources(
    id: Optional[str] = Query(None),
    name: Optional[str] = Query(None),
    version: Optional[str] = Query(None),
    stage_id: Optional[str] = Query(None),
    status_id: Optional[str] = Query(None),
    platform_id: Optional[str] = Query(None),
    product_type_id: Optional[str] = Query(None),
    repo_id: Optional[str] = Query(None),
    tag_id: Optional[str] = Query(None),
    include_deleted: bool = Query(False),
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """List all resources (admin only)."""
    filters = ResourceGet(
        id=id,
        name=name,
        version=version,
        stage_id=stage_id,
        status_id=status_id,
        platform_id=platform_id,
        product_type_id=product_type_id,
        repo_id=repo_id,
        tag_id=tag_id,
    )
    resources = resource_service.search_all_resources(
        db_session, filters, user[0], include_deleted=include_deleted
    )
    return ResponseObject(
        data=[_enrich_resource(r, db_session) for r in resources],
        code="BE0000",
    )


@resource_routers.put("/admin/resources/{resource_id}")
def admin_update_resource(
    resource_id: str,
    resource_update: ResourceUpdate,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Update any resource (admin only)."""
    data = resource_service.admin_update(db_session, resource_id, resource_update, user[0])
    return ResponseObject(data=_enrich_resource(data, db_session), code="BE0000")


@resource_routers.delete("/admin/resources/{resource_id}")
def admin_delete_resource(
    resource_id: str,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Soft-delete any resource (admin only)."""
    resource_service.admin_delete(db_session, resource_id, user[0])
    return ResponseObject(message="Delete Resource Success", code="BE0000")


@resource_routers.post("/admin/resources/{resource_id}/restore")
def admin_restore_resource(
    resource_id: str,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Restore a soft-deleted resource (admin only)."""
    data = resource_service.admin_restore(db_session, resource_id, user[0])
    return ResponseObject(data=_enrich_resource(data, db_session), code="BE0000", message="Restore success")
