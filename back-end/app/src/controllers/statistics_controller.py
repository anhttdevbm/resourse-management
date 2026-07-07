"""Statistics controller."""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.src.utils.connection.sql_connection import get_db_session
from app.src.services.statistics_service import StatisticsService
from app.src.schemas.response import ResponseObject

statistics_routers = APIRouter()
statistics_service = StatisticsService()


@statistics_routers.get("/statistics", response_model=ResponseObject)
def get_statistics(db_session: Session = Depends(get_db_session)):
    """Get system statistics (public endpoint)."""
    try:
        print("🔄 Getting statistics...")
        statistics = statistics_service.get_statistics(db_session)
        
        print(f"📊 Statistics data: {statistics}")
        return ResponseObject(data=statistics, code="BE0000")
        
    except Exception as e:
        print(f"❌ Statistics Controller Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/recent-activities", response_model=ResponseObject)
def get_recent_activities(
    limit: int = Query(default=10, ge=1, le=500),
    db_session: Session = Depends(get_db_session)
):
    """Get recent activities."""
    try:
        print(f"🔄 Getting recent activities (limit: {limit})...")
        activities = statistics_service.get_recent_activities(db_session, limit)
        
        print(f"📊 Recent activities count: {len(activities)}")
        return ResponseObject(data=activities, code="BE0000")
        
    except Exception as e:
        print(f"❌ Recent Activities Controller Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/file-types", response_model=ResponseObject)
def get_file_type_statistics(db_session: Session = Depends(get_db_session)):
    """Get file type statistics."""
    try:
        print("🔄 Getting file type statistics...")
        file_types = statistics_service.get_file_type_statistics(db_session)
        
        print(f"📊 File types count: {len(file_types)}")
        return ResponseObject(data=file_types, code="BE0000")
        
    except Exception as e:
        print(f"❌ File Type Statistics Controller Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/top-downloads", response_model=ResponseObject)
def get_top_downloaded_resources(
    limit: int = Query(default=10, ge=1, le=50),
    db_session: Session = Depends(get_db_session)
):
    """Get top downloaded resources."""
    try:
        print(f"🔄 Getting top downloaded resources (limit: {limit})...")
        top_resources = statistics_service.get_top_downloaded_resources(db_session, limit)
        
        print(f"📊 Top resources count: {len(top_resources)}")
        return ResponseObject(data=top_resources, code="BE0000")
        
    except Exception as e:
        print(f"❌ Top Downloads Controller Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/storage-usage", response_model=ResponseObject)
def get_storage_usage(db_session: Session = Depends(get_db_session)):
    """Get storage usage statistics."""
    try:
        print("🔄 Getting storage usage...")
        storage_data = statistics_service.get_storage_usage(db_session)
        
        print(f"📊 Storage usage: {storage_data}")
        return ResponseObject(data=storage_data, code="BE0000")
        
    except Exception as e:
        print(f"❌ Storage Usage Controller Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/security", response_model=ResponseObject)
def get_security_statistics(db_session: Session = Depends(get_db_session)):
    """Get security scanning statistics."""
    try:
        print("🔄 Getting security statistics...")
        security_data = statistics_service.get_security_statistics(db_session)
        
        print(f"📊 Security stats: {security_data}")
        return ResponseObject(data=security_data, code="BE0000")
        
    except Exception as e:
        print(f"❌ Security Statistics Controller Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/downloads", response_model=ResponseObject)
def get_download_statistics(
    period: str = Query(default="7d", regex="^(1d|7d|30d|90d|1y)$"),
    db_session: Session = Depends(get_db_session)
):
    """Get download statistics for a specific period."""
    try:
        print(f"🔄 Getting download statistics (period: {period})...")
        download_stats = statistics_service.get_download_statistics(db_session, period)
        
        print(f"📊 Download stats: {download_stats}")
        return ResponseObject(data=download_stats, code="BE0000")
        
    except Exception as e:
        print(f"❌ Download Statistics Controller Error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/uploads", response_model=ResponseObject)
def get_upload_statistics(
    period: str = Query(default="7d", pattern="^(1d|7d|30d|90d|1y)$"),
    db_session: Session = Depends(get_db_session),
):
    """Upload statistics for a specific period."""
    try:
        data = statistics_service.get_upload_statistics(db_session, period)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/users", response_model=ResponseObject)
def get_user_statistics(
    period: str = Query(default="30d", pattern="^(1d|7d|30d|90d|1y)$"),
    db_session: Session = Depends(get_db_session),
):
    """User registration and activity statistics."""
    try:
        data = statistics_service.get_user_statistics(db_session, period)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/resource-status", response_model=ResponseObject)
def get_resource_status_breakdown(db_session: Session = Depends(get_db_session)):
    """Resources grouped by status."""
    try:
        data = statistics_service.get_resource_status_breakdown(db_session)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/platforms", response_model=ResponseObject)
def get_platform_breakdown(db_session: Session = Depends(get_db_session)):
    """Resources grouped by platform."""
    try:
        data = statistics_service.get_platform_breakdown(db_session)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/product-types", response_model=ResponseObject)
def get_product_type_breakdown(db_session: Session = Depends(get_db_session)):
    """Resources grouped by product type."""
    try:
        data = statistics_service.get_product_type_breakdown(db_session)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@statistics_routers.get("/statistics/stages", response_model=ResponseObject)
def get_stage_breakdown(db_session: Session = Depends(get_db_session)):
    """Resources grouped by stage."""
    try:
        data = statistics_service.get_stage_breakdown(db_session)
        return ResponseObject(data=data, code="BE0000")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))