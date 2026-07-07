"""Statistics service."""
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, cast, Date, desc
from datetime import date, datetime, timedelta
from app.src.models import (
    User,
    Resource,
    ResourceTag,
    ProductType,
    ResourceStatus,
    ResourcePlatform,
    ResourceStage,
    DownloadLog,
    Permission,
)


class StatisticsService:
    """Statistics service class."""
    
    def get_statistics(self, db_session: Session) -> dict:
        """Get system statistics."""
        try:
            # Count total resources (not deleted)
            total_resources = db_session.query(Resource).filter(
                Resource.is_deleted.is_(False)
            ).count()
            
            # Count uploads today (resources created today)
            today = date.today()
            uploads_today = db_session.query(Resource).filter(
                and_(
                    Resource.is_deleted.is_(False),
                    cast(Resource.created_at, Date) == today
                )
            ).count()
            
            # Count total downloads from download logs
            total_downloads = db_session.query(func.count(DownloadLog.id)).scalar() or 0
            
            # Count files pending review
            # Look for resources with status containing "pending", "review", "kiểm duyệt", or similar
            # Using LIKE for more flexible matching
            pending_statuses = db_session.query(ResourceStatus).filter(
                and_(
                    ResourceStatus.is_deleted.is_(False),
                    or_(
                        func.lower(ResourceStatus.name).like('%pending%'),
                        func.lower(ResourceStatus.name).like('%review%'),
                        func.lower(ResourceStatus.name).like('%kiểm duyệt%'),
                        func.lower(ResourceStatus.name).like('%chờ duyệt%'),
                        func.lower(ResourceStatus.name).like('%đang kiểm duyệt%')
                    )
                )
            ).all()
            
            files_pending_review = 0
            if pending_statuses:
                pending_status_ids = [status.id for status in pending_statuses]
                files_pending_review = db_session.query(Resource).filter(
                    and_(
                        Resource.is_deleted.is_(False),
                        Resource.status_id.in_(pending_status_ids)
                    )
                ).count()
            else:
                # If no specific pending status found, check for resources without status
                # or with status_id that might indicate pending
                files_pending_review = db_session.query(Resource).filter(
                    and_(
                        Resource.is_deleted.is_(False),
                        Resource.status_id.is_(None)
                    )
                ).count()
            
            # Count total users (not deleted)
            total_users = db_session.query(User).filter(
                User.is_deleted.is_(False)
            ).count()
            
            # Count unique file types from resources
            file_extensions = db_session.query(Resource.url).filter(
                Resource.is_deleted.is_(False)
            ).all()
            
            # Extract extensions from URLs
            extensions = set()
            for url_tuple in file_extensions:
                url = url_tuple[0] if url_tuple[0] else ""
                if '.' in url:
                    ext = url.split('.')[-1].lower()
                    extensions.add(ext)
            
            total_file_types = len(extensions)
            
            return {
                "total_resources": total_resources,
                "uploads_today": uploads_today,
                "total_downloads": total_downloads,
                "files_pending_review": files_pending_review,
                "total_users": total_users,
                "total_file_types": total_file_types
            }
            
        except Exception as e:
            print(f"❌ Statistics Error: {str(e)}")
            raise e

    def get_recent_activities(self, db_session: Session, limit: int = 10) -> list:
        """Get recent activities from resources."""
        try:
            # Get recent resources with their status
            recent_resources = db_session.query(
                Resource, ResourceStatus
            ).outerjoin(
                ResourceStatus, Resource.status_id == ResourceStatus.id
            ).filter(
                Resource.is_deleted.is_(False)
            ).order_by(
                desc(Resource.created_at)
            ).limit(limit).all()
            
            activities = []
            now = datetime.now()
            
            for resource, status in recent_resources:
                # Calculate time ago
                time_diff = now - resource.created_at if resource.created_at else timedelta(0)
                time_ago = self._format_time_ago(time_diff)
                
                # Determine activity type based on status
                activity_type = "upload"  # Default
                color = "blue"
                
                if status:
                    status_name_lower = status.name.lower() if status.name else ""
                    if any(word in status_name_lower for word in ['pending', 'review', 'chờ', 'kiểm duyệt']):
                        activity_type = "pending"
                        color = "yellow"
                    elif any(word in status_name_lower for word in ['approved', 'active', 'hoạt động', 'duyệt']):
                        activity_type = "approved"
                        color = "green"
                    elif any(word in status_name_lower for word in ['rejected', 'virus', 'từ chối', 'nguy hiểm']):
                        activity_type = "rejected"
                        color = "red"
                
                # Get file extension from URL
                file_ext = ""
                if resource.url and '.' in resource.url:
                    file_ext = resource.url.split('.')[-1].upper()
                
                # Create activity message
                if activity_type == "upload":
                    message = f'File "{resource.name}" đã được upload'
                elif activity_type == "pending":
                    message = f'File "{resource.name}" đang chờ kiểm duyệt'
                elif activity_type == "approved":
                    message = f'File "{resource.name}" đã được duyệt'
                elif activity_type == "rejected":
                    message = f'Phát hiện vấn đề với file: "{resource.name}"'
                else:
                    message = f'File "{resource.name}" được cập nhật'
                
                activities.append({
                    "id": str(resource.id),
                    "type": activity_type,
                    "message": message,
                    "time_ago": time_ago,
                    "color": color,
                    "file_name": resource.name,
                    "file_ext": file_ext,
                    "created_at": resource.created_at.isoformat() if resource.created_at else None
                })
            
            return activities
            
        except Exception as e:
            print(f"❌ Recent Activities Error: {str(e)}")
            raise e

    def get_file_type_statistics(self, db_session: Session) -> list:
        """Get statistics grouped by file type."""
        try:
            # Get all resources URLs
            resources = db_session.query(Resource.url).filter(
                Resource.is_deleted.is_(False)
            ).all()
            
            # Count file types
            file_type_counts = {}
            total_count = 0
            
            for url_tuple in resources:
                url = url_tuple[0] if url_tuple[0] else ""
                if '.' in url:
                    ext = url.split('.')[-1].upper()
                    # Normalize common extensions
                    if ext in ['APK']:
                        ext = 'APK'
                    elif ext in ['EXE', 'MSI']:
                        ext = 'EXE'
                    elif ext in ['ISO', 'IMG']:
                        ext = 'ISO'
                    elif ext in ['ZIP', 'RAR', '7Z', 'TAR', 'GZ']:
                        ext = 'Archive'
                    elif ext in ['PDF', 'DOC', 'DOCX', 'XLS', 'XLSX']:
                        ext = 'Document'
                    elif ext in ['MP4', 'AVI', 'MKV', 'MOV']:
                        ext = 'Video'
                    elif ext in ['MP3', 'WAV', 'FLAC']:
                        ext = 'Audio'
                    elif ext in ['JPG', 'JPEG', 'PNG', 'GIF', 'SVG']:
                        ext = 'Image'
                    
                    file_type_counts[ext] = file_type_counts.get(ext, 0) + 1
                    total_count += 1
            
            # Convert to list with percentages
            file_types = []
            
            # Define colors for file types
            colors = {
                'APK': 'blue',
                'EXE': 'green',
                'ISO': 'yellow',
                'Archive': 'purple',
                'Document': 'orange',
                'Video': 'red',
                'Audio': 'pink',
                'Image': 'cyan'
            }
            
            # Sort by count descending
            sorted_types = sorted(file_type_counts.items(), key=lambda x: x[1], reverse=True)
            
            for file_type, count in sorted_types[:8]:  # Top 8 types
                percentage = round((count / total_count * 100), 1) if total_count > 0 else 0
                file_types.append({
                    "type": file_type,
                    "count": count,
                    "percentage": percentage,
                    "color": colors.get(file_type, 'gray')
                })
            
            # Group remaining as "Other"
            other_count = sum(count for file_type, count in sorted_types[8:])
            if other_count > 0:
                percentage = round((other_count / total_count * 100), 1) if total_count > 0 else 0
                file_types.append({
                    "type": "Other",
                    "count": other_count,
                    "percentage": percentage,
                    "color": "gray"
                })
            
            return file_types
            
        except Exception as e:
            print(f"❌ File Type Statistics Error: {str(e)}")
            raise e

    def get_top_downloaded_resources(self, db_session: Session, limit: int = 10) -> list:
        """Get top downloaded resources ordered by download_count."""
        try:
            top_resources = db_session.query(Resource).filter(
                Resource.is_deleted.is_(False)
            ).order_by(
                desc(Resource.download_count),
                desc(Resource.created_at),
            ).limit(limit).all()
            
            result = []
            for resource in top_resources:
                file_ext = ""
                if resource.url and "." in resource.url:
                    file_ext = resource.url.split(".")[-1].upper()
                display_name = (resource.name or "").strip() or "Tài nguyên"
                result.append({
                    "id": str(resource.id),
                    "name": display_name,
                    "extension": file_ext,
                    "downloads": resource.download_count or 0,
                    "url": resource.url or "",
                })
            return result[:limit]
        except Exception as e:
            print(f"❌ Top Downloaded Resources Error: {str(e)}")
            raise e

    def get_storage_usage(self, db_session: Session) -> dict:
        """Get storage usage statistics."""
        try:
            # Count total resources
            total_resources = db_session.query(Resource).filter(
                Resource.is_deleted.is_(False)
            ).count()
            
            # Estimate storage (in TB)
            # Average file size estimation based on file type
            # This is a simplified calculation - in production, get actual sizes from S3
            estimated_total_size_gb = total_resources * 2.0  # Assume average 2GB per file
            estimated_total_size_tb = estimated_total_size_gb / 1024.0
            
            # Total storage capacity (assume 4TB total)
            total_capacity_tb = 4.0
            used_space_tb = round(estimated_total_size_tb, 1)
            available_space_tb = round(total_capacity_tb - used_space_tb, 1)
            usage_percentage = round((used_space_tb / total_capacity_tb * 100), 1) if total_capacity_tb > 0 else 0
            
            return {
                "used_space_tb": used_space_tb,
                "available_space_tb": available_space_tb,
                "total_capacity_tb": total_capacity_tb,
                "usage_percentage": usage_percentage,
                "total_files": total_resources
            }
            
        except Exception as e:
            print(f"❌ Storage Usage Error: {str(e)}")
            raise e

    def get_security_statistics(self, db_session: Session) -> dict:
        """Get security scanning statistics."""
        try:
            # Count all resources (files scanned)
            files_scanned = db_session.query(Resource).filter(
                Resource.is_deleted.is_(False)
            ).count()
            
            # Count clean files (approved/active status)
            clean_statuses = db_session.query(ResourceStatus).filter(
                and_(
                    ResourceStatus.is_deleted.is_(False),
                    or_(
                        func.lower(ResourceStatus.name).like('%approved%'),
                        func.lower(ResourceStatus.name).like('%active%'),
                        func.lower(ResourceStatus.name).like('%hoạt động%'),
                        func.lower(ResourceStatus.name).like('%duyệt%'),
                        func.lower(ResourceStatus.name).like('%clean%'),
                        func.lower(ResourceStatus.name).like('%safe%')
                    )
                )
            ).all()
            
            clean_files = 0
            if clean_statuses:
                clean_status_ids = [status.id for status in clean_statuses]
                clean_files = db_session.query(Resource).filter(
                    and_(
                        Resource.is_deleted.is_(False),
                        Resource.status_id.in_(clean_status_ids)
                    )
                ).count()
            else:
                # If no specific clean status, assume all files with status are clean
                clean_files = db_session.query(Resource).filter(
                    and_(
                        Resource.is_deleted.is_(False),
                        Resource.status_id.isnot(None)
                    )
                ).count()
            
            # Count infected files (rejected/virus status)
            infected_statuses = db_session.query(ResourceStatus).filter(
                and_(
                    ResourceStatus.is_deleted.is_(False),
                    or_(
                        func.lower(ResourceStatus.name).like('%rejected%'),
                        func.lower(ResourceStatus.name).like('%virus%'),
                        func.lower(ResourceStatus.name).like('%malware%'),
                        func.lower(ResourceStatus.name).like('%infected%'),
                        func.lower(ResourceStatus.name).like('%nguy hiểm%'),
                        func.lower(ResourceStatus.name).like('%từ chối%')
                    )
                )
            ).all()
            
            infected_files = 0
            if infected_statuses:
                infected_status_ids = [status.id for status in infected_statuses]
                infected_files = db_session.query(Resource).filter(
                    and_(
                        Resource.is_deleted.is_(False),
                        Resource.status_id.in_(infected_status_ids)
                    )
                ).count()
            
            return {
                "files_scanned": files_scanned,
                "clean_files": clean_files,
                "infected_files": infected_files
            }
            
        except Exception as e:
            print(f"❌ Security Statistics Error: {str(e)}")
            raise e

    def get_download_statistics(self, db_session: Session, period: str = "7d") -> dict:
        """Get download statistics for a specific period from download_logs."""
        try:
            end_date = datetime.now()
            if period == "1d":
                start_date = end_date - timedelta(days=1)
            elif period == "7d":
                start_date = end_date - timedelta(days=7)
            elif period == "30d":
                start_date = end_date - timedelta(days=30)
            elif period == "90d":
                start_date = end_date - timedelta(days=90)
            elif period == "1y":
                start_date = end_date - timedelta(days=365)
            else:
                start_date = end_date - timedelta(days=7)

            day_col = cast(DownloadLog.downloaded_at, Date).label("day")
            rows = (
                db_session.query(day_col, func.count(DownloadLog.id).label("cnt"))
                .filter(
                    DownloadLog.downloaded_at >= start_date,
                    DownloadLog.downloaded_at <= end_date,
                )
                .group_by(day_col)
                .order_by(day_col)
                .all()
            )

            time_series = [
                {"date": row.day.isoformat(), "downloads": row.cnt} for row in rows
            ]
            counts = [row.cnt for row in rows]
            total_downloads = sum(counts)
            average_downloads = round(total_downloads / len(counts), 2) if counts else 0.0
            peak_downloads = max(counts) if counts else 0

            return {
                "period": period,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "total_downloads": total_downloads,
                "average_downloads": average_downloads,
                "peak_downloads": peak_downloads,
                "time_series": time_series,
            }

        except Exception as e:
            print(f"❌ Download Statistics Error: {str(e)}")
            raise e

    def _resolve_period(self, period: str) -> tuple[datetime, datetime]:
        end_date = datetime.now()
        days_map = {"1d": 1, "7d": 7, "30d": 30, "90d": 90, "1y": 365}
        start_date = end_date - timedelta(days=days_map.get(period, 7))
        return start_date, end_date

    def _build_daily_series(
        self, start_date: datetime, end_date: datetime, rows: list, value_key: str
    ) -> list[dict]:
        counts_by_day = {row.day.isoformat(): row.cnt for row in rows}
        series: list[dict] = []
        cursor = start_date.date()
        end = end_date.date()
        while cursor <= end:
            key = cursor.isoformat()
            series.append({value_key: counts_by_day.get(key, 0), "date": key})
            cursor += timedelta(days=1)
        return series

    def get_upload_statistics(self, db_session: Session, period: str = "7d") -> dict:
        """Upload (resource creation) statistics for a period."""
        try:
            start_date, end_date = self._resolve_period(period)
            day_col = cast(Resource.created_at, Date).label("day")
            rows = (
                db_session.query(day_col, func.count(Resource.id).label("cnt"))
                .filter(
                    Resource.is_deleted.is_(False),
                    Resource.created_at >= start_date,
                    Resource.created_at <= end_date,
                )
                .group_by(day_col)
                .order_by(day_col)
                .all()
            )
            time_series = self._build_daily_series(start_date, end_date, rows, "uploads")
            counts = [p["uploads"] for p in time_series]
            total_uploads = sum(counts)
            return {
                "period": period,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "total_uploads": total_uploads,
                "average_uploads": round(total_uploads / len(counts), 2) if counts else 0.0,
                "peak_uploads": max(counts) if counts else 0,
                "time_series": time_series,
            }
        except Exception as e:
            print(f"❌ Upload Statistics Error: {str(e)}")
            raise e

    def get_user_statistics(self, db_session: Session, period: str = "30d") -> dict:
        """User registration and activity statistics."""
        try:
            start_date, end_date = self._resolve_period(period)
            today = date.today()

            total_users = db_session.query(User).filter(User.is_deleted.is_(False)).count()
            new_users_today = db_session.query(User).filter(
                User.is_deleted.is_(False),
                cast(User.created_at, Date) == today,
            ).count()
            locked_users = db_session.query(User).filter(
                User.is_deleted.is_(False),
                User.is_locked.is_(True),
            ).count()

            admin_users = (
                db_session.query(func.count(func.distinct(User.id)))
                .join(User.permissions)
                .filter(
                    User.is_deleted.is_(False),
                    Permission.name == "AllAccess",
                    Permission.is_deleted.is_(False),
                )
                .scalar()
            ) or 0

            active_downloaders = (
                db_session.query(func.count(func.distinct(DownloadLog.user_id)))
                .filter(DownloadLog.downloaded_at >= start_date)
                .scalar()
            ) or 0

            day_col = cast(User.created_at, Date).label("day")
            reg_rows = (
                db_session.query(day_col, func.count(User.id).label("cnt"))
                .filter(
                    User.is_deleted.is_(False),
                    User.created_at >= start_date,
                    User.created_at <= end_date,
                )
                .group_by(day_col)
                .order_by(day_col)
                .all()
            )
            registrations = self._build_daily_series(start_date, end_date, reg_rows, "registrations")

            return {
                "period": period,
                "start_date": start_date.isoformat(),
                "end_date": end_date.isoformat(),
                "total_users": total_users,
                "new_users_today": new_users_today,
                "locked_users": locked_users,
                "admin_users": admin_users,
                "active_downloaders": active_downloaders,
                "registrations": registrations,
            }
        except Exception as e:
            print(f"❌ User Statistics Error: {str(e)}")
            raise e

    def _breakdown_with_percentage(self, rows: list[tuple[str, int]]) -> list[dict]:
        total = sum(count for _, count in rows) or 1
        palette = ["blue", "green", "yellow", "purple", "orange", "red", "cyan", "gray"]
        result = []
        for idx, (name, count) in enumerate(rows):
            result.append({
                "name": name or "Unknown",
                "count": count,
                "percentage": round((count / total) * 100, 1),
                "color": palette[idx % len(palette)],
            })
        return result

    def get_resource_status_breakdown(self, db_session: Session) -> list[dict]:
        """Resources grouped by approval/status name."""
        try:
            rows = (
                db_session.query(ResourceStatus.name, func.count(Resource.id))
                .join(Resource, Resource.status_id == ResourceStatus.id)
                .filter(Resource.is_deleted.is_(False), ResourceStatus.is_deleted.is_(False))
                .group_by(ResourceStatus.name)
                .order_by(desc(func.count(Resource.id)))
                .all()
            )
            no_status = db_session.query(Resource).filter(
                Resource.is_deleted.is_(False),
                Resource.status_id.is_(None),
            ).count()
            items = self._breakdown_with_percentage([(n, c) for n, c in rows])
            if no_status:
                total = sum(i["count"] for i in items) + no_status
                for item in items:
                    item["percentage"] = round((item["count"] / total) * 100, 1)
                items.append({
                    "name": "No status",
                    "count": no_status,
                    "percentage": round((no_status / total) * 100, 1),
                    "color": "gray",
                })
            return items
        except Exception as e:
            print(f"❌ Resource Status Breakdown Error: {str(e)}")
            raise e

    def get_platform_breakdown(self, db_session: Session) -> list[dict]:
        """Resources grouped by platform."""
        try:
            rows = (
                db_session.query(ResourcePlatform.name, func.count(Resource.id))
                .join(Resource, Resource.platform_id == ResourcePlatform.id)
                .filter(Resource.is_deleted.is_(False), ResourcePlatform.is_deleted.is_(False))
                .group_by(ResourcePlatform.name)
                .order_by(desc(func.count(Resource.id)))
                .all()
            )
            return self._breakdown_with_percentage([(n, c) for n, c in rows])
        except Exception as e:
            print(f"❌ Platform Breakdown Error: {str(e)}")
            raise e

    def get_product_type_breakdown(self, db_session: Session) -> list[dict]:
        """Resources grouped by product type."""
        try:
            rows = (
                db_session.query(ProductType.name, func.count(Resource.id))
                .join(Resource, Resource.product_type_id == ProductType.id)
                .filter(Resource.is_deleted.is_(False), ProductType.is_deleted.is_(False))
                .group_by(ProductType.name)
                .order_by(desc(func.count(Resource.id)))
                .all()
            )
            return self._breakdown_with_percentage([(n, c) for n, c in rows])
        except Exception as e:
            print(f"❌ Product Type Breakdown Error: {str(e)}")
            raise e

    def get_stage_breakdown(self, db_session: Session) -> list[dict]:
        """Resources grouped by lifecycle stage."""
        try:
            rows = (
                db_session.query(ResourceStage.name, func.count(Resource.id))
                .join(Resource, Resource.stage_id == ResourceStage.id)
                .filter(Resource.is_deleted.is_(False), ResourceStage.is_deleted.is_(False))
                .group_by(ResourceStage.name)
                .order_by(desc(func.count(Resource.id)))
                .all()
            )
            return self._breakdown_with_percentage([(n, c) for n, c in rows])
        except Exception as e:
            print(f"❌ Stage Breakdown Error: {str(e)}")
            raise e

    def _format_time_ago(self, time_diff: timedelta) -> str:
        """Format time difference to human readable string."""
        total_seconds = int(time_diff.total_seconds())
        
        if total_seconds < 60:
            return "Vừa xong"
        elif total_seconds < 3600:
            minutes = total_seconds // 60
            return f"{minutes} phút trước"
        elif total_seconds < 86400:
            hours = total_seconds // 3600
            return f"{hours} giờ trước"
        elif total_seconds < 604800:
            days = total_seconds // 86400
            return f"{days} ngày trước"
        elif total_seconds < 2592000:
            weeks = total_seconds // 604800
            return f"{weeks} tuần trước"
        else:
            months = total_seconds // 2592000
            return f"{months} tháng trước"
