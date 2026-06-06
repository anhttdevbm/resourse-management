# Menu System Design

## Role-Based Menu Structure

### 1. USER MENU (Regular Users)
```
📁 MAIN
  🏠 Dashboard
    - Tổng quan hệ thống (/dashboard)
    - Thống kê tải xuống (/dashboard/downloads)

📁 QUẢN LÝ TÀI NGUYÊN SỐ
  📥 Quản lý tài nguyên (manage_resources)
    - Danh sách tài nguyên (/resources)
    - Thêm tài nguyên mới (/resources/add)
    - Phân loại tài nguyên (/resources/categories)
  
  📄 Loại file (manage_file_types)
    - APK Files (/file-types/apk)
    - EXE Files (/file-types/exe)
    - ISO Files (/file-types/iso)
    - Other Files (/file-types/others)
  
  📤 Quản lý Upload (manage_uploads)
    - Upload tài nguyên (/uploads)
    - Lịch sử upload (/uploads/history)
    - Queue xử lý (/uploads/queue)

📁 LƯU TRỮ & BẢO MẬT
  💾 Quản lý Storage (manage_storage)
    - Disk Usage (/storage/usage)
    - Backup & Restore (/storage/backup)
    - Cleanup Tools (/storage/cleanup)
  
  🛡️ Bảo mật (manage_security)
    - Virus Scan (/security/scan)
    - File Validation (/security/validation)
    - Security Reports (/security/reports)

📁 PHÂN LOẠI & TÌM KIẾM
  🏷️ Danh mục (manage_categories)
    - Danh mục chính (/categories)
    - Tags & Labels (/categories/tags)
    - Auto Classification (/categories/auto)
  
  🔍 Tìm kiếm & Lọc
    - Tìm kiếm nâng cao (/search)
    - Bộ lọc (/filters)
    - Lịch sử tìm kiếm (/search/history)

📁 CÁ NHÂN
  👤 Thông tin cá nhân
    - Profile (/profile)
    - Đổi mật khẩu (/profile/password)
    - Cài đặt (/profile/settings)
  
  📊 Hoạt động cá nhân
    - Lịch sử tải xuống (/my-downloads)
    - Favorites (/my-favorites)
    - Bookmarks (/my-bookmarks)
```

### 2. ADMIN MENU (Administrators)
```
📁 ADMIN PANEL (Chỉ Admin)
  👥 Quản lý người dùng (manage_users)
    - Danh sách người dùng (/admin/users)
    - Phân quyền (/admin/permissions)
    - User Activity Log (/admin/user-logs)
  
  ⚙️ Quản lý hệ thống (manage_system)
    - Cấu hình hệ thống (/admin/system)
    - Log hệ thống (/admin/logs)
    - System Health (/admin/health)
  
  📊 Báo cáo quản trị (view_reports)
    - Báo cáo tổng quan (/admin/reports)
    - Thống kê chi tiết (/admin/statistics)
    - Resource Usage (/admin/resource-usage)

📁 ADVANCED MANAGEMENT
  🔧 Cấu hình nâng cao (manage_advanced)
    - API Settings (/admin/api)
    - Integration (/admin/integrations)
    - Webhooks (/admin/webhooks)
  
  📈 Analytics & Monitoring (view_analytics)
    - Real-time Monitoring (/admin/monitoring)
    - Performance Metrics (/admin/performance)
    - Error Tracking (/admin/errors)
```

## Permission Matrix

| Permission | User | Admin | Description |
|------------|------|-------|-------------|
| manage_resources | ✅ | ✅ | Quản lý tài nguyên |
| manage_file_types | ✅ | ✅ | Quản lý loại file |
| manage_uploads | ✅ | ✅ | Quản lý upload |
| manage_storage | ✅ | ✅ | Quản lý storage |
| manage_security | ✅ | ✅ | Quản lý bảo mật |
| manage_categories | ✅ | ✅ | Quản lý danh mục |
| manage_users | ❌ | ✅ | Quản lý người dùng |
| manage_system | ❌ | ✅ | Quản lý hệ thống |
| view_reports | ❌ | ✅ | Xem báo cáo |
| manage_advanced | ❌ | ✅ | Cấu hình nâng cao |
| view_analytics | ❌ | ✅ | Analytics |

## Implementation Strategy

### 1. Menu Components
- `UserMenu.tsx` - Menu cho User thường
- `AdminMenu.tsx` - Menu cho Admin
- `MenuRenderer.tsx` - Component render menu dựa trên role

### 2. Permission System
- `usePermissions()` - Hook kiểm tra permissions
- `PermissionGuard` - Component bảo vệ routes
- `MenuPermission` - Component kiểm tra quyền hiển thị menu

### 3. Role Detection
- `useRole()` - Hook xác định role
- `isAdmin()` - Function kiểm tra admin
- `hasPermission()` - Function kiểm tra permission
