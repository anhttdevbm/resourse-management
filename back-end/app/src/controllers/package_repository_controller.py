"""Define package repository controller."""
from typing import Tuple

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.src.controllers.auth_controller import user_service
from app.src.models import User
from app.src.schemas.package_repository import PackageRepositoryCreate, PackageRepositoryUpdate
from app.src.schemas.response import ResponseObject
from app.src.services.package_repo_service import PackageRepositoryService
from app.src.utils.common import row2dict
from app.src.utils.connection.sql_connection import get_db_session

package_repository_service = PackageRepositoryService()
package_repositories_routers = APIRouter()


@package_repositories_routers.put("/package_repositories/{package_repository_id}")
def update_package_repository(
    package_repository_id: str,
    package_repository_update: PackageRepositoryUpdate,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Update an existing package repository (owner only)."""
    data = package_repository_service.update(
        db_session, package_repository_id, package_repository_update, user[0].id
    )
    return ResponseObject(data=row2dict(data), code="BE0000")


@package_repositories_routers.get("/package_repositories")
def read_package_repositories(
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """List repositories for current user."""
    data = package_repository_service.get_all(db_session, user[0].id)
    return ResponseObject(data=data, code="BE0000")


@package_repositories_routers.get("/package_repositories/{package_repository_id}")
def read_package_repository_by_id(
    package_repository_id: str,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Get package repository by id (owner only)."""
    data = package_repository_service.get(db_session, package_repository_id, user[0].id)
    return ResponseObject(data=row2dict(data), code="BE0000")


@package_repositories_routers.post("/package_repository")
def create_package_repository(
    package_repository_create: PackageRepositoryCreate,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Create a repository for current user."""
    data = package_repository_service.create(db_session, package_repository_create, user[0].id)
    return ResponseObject(data=row2dict(data), code="BE0000")


@package_repositories_routers.delete("/package_repositories/{package_repository_id}")
def delete_package_repository(
    package_repository_id: str,
    db_session: Session = Depends(get_db_session),
    user: Tuple[User, str] = Depends(user_service.get_current_user),
) -> ResponseObject:
    """Delete a package repository (owner only)."""
    package_repository_service.delete(db_session, package_repository_id, user[0].id)
    return ResponseObject(message="Delete Package Repository Success", code="BE0000")
