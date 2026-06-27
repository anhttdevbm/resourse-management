import { ProtectedRoute } from '../components/ProtectedRoute';

// ==================== USER ROUTES ====================
export const userRoutes = [
  // Dashboard Routes
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <div>Dashboard - Tổng quan hệ thống</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/dashboard/downloads',
    element: (
      <ProtectedRoute>
        <div>Thống kê tải xuống</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/dashboard/activity',
    element: (
      <ProtectedRoute>
        <div>Hoạt động gần đây</div>
      </ProtectedRoute>
    )
  },

  // Resource Routes
  {
    path: '/resources',
    element: (
      <ProtectedRoute requiredPermission="view_resources">
        <div>Danh sách tài nguyên</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/resources/downloaded',
    element: (
      <ProtectedRoute requiredPermission="view_resources">
        <div>Tài nguyên đã tải</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/resources/favorites',
    element: (
      <ProtectedRoute requiredPermission="view_resources">
        <div>Tài nguyên yêu thích</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/resources/upload',
    element: (
      <ProtectedRoute requiredPermission="upload_resources">
        <div>Upload mới</div>
      </ProtectedRoute>
    )
  },

  // Upload Routes
  {
    path: '/uploads/history',
    element: (
      <ProtectedRoute requiredPermission="upload_resources">
        <div>Lịch sử upload</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/uploads/queue',
    element: (
      <ProtectedRoute requiredPermission="upload_resources">
        <div>Queue xử lý</div>
      </ProtectedRoute>
    )
  },

  // File Types Routes
  {
    path: '/file-types/apk',
    element: (
      <ProtectedRoute>
        <div>APK Files</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/file-types/exe',
    element: (
      <ProtectedRoute requiredPermission="view_file_types">
        <div>EXE Files</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/file-types/iso',
    element: (
      <ProtectedRoute requiredPermission="view_file_types">
        <div>ISO Files</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/file-types/others',
    element: (
      <ProtectedRoute requiredPermission="view_file_types">
        <div>Other Files</div>
      </ProtectedRoute>
    )
  },

  // Search Routes
  {
    path: '/search',
    element: (
      <ProtectedRoute>
        <div>Tìm kiếm nâng cao</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/filters',
    element: (
      <ProtectedRoute>
        <div>Bộ lọc</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/search/history',
    element: (
      <ProtectedRoute>
        <div>Lịch sử tìm kiếm</div>
      </ProtectedRoute>
    )
  },

  // Categories Routes
  {
    path: '/categories',
    element: (
      <ProtectedRoute requiredPermission="view_categories">
        <div>Danh mục chính</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/categories/tags',
    element: (
      <ProtectedRoute requiredPermission="view_categories">
        <div>Tags & Labels</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/categories/auto',
    element: (
      <ProtectedRoute requiredPermission="view_categories">
        <div>Auto Classification</div>
      </ProtectedRoute>
    )
  },

  // Profile Routes
  {
    path: '/profile',
    element: (
      <ProtectedRoute>
        <div>Profile</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/profile/password',
    element: (
      <ProtectedRoute>
        <div>Đổi mật khẩu</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/profile/settings',
    element: (
      <ProtectedRoute>
        <div>Cài đặt</div>
      </ProtectedRoute>
    )
  },

  // Activity Routes
  {
    path: '/my-downloads',
    element: (
      <ProtectedRoute>
        <div>Lịch sử tải xuống</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/my-favorites',
    element: (
      <ProtectedRoute>
        <div>Favorites</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/my-bookmarks',
    element: (
      <ProtectedRoute>
        <div>Bookmarks</div>
      </ProtectedRoute>
    )
  }
];

// ==================== ADMIN ROUTES ====================
export const adminRoutes = [
  // User Management Routes
  {
    path: '/admin/users',
    element: (
      <ProtectedRoute requiredPermission="manage_users">
        <div>Danh sách người dùng</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/permissions',
    element: (
      <ProtectedRoute requiredPermission="manage_users">
        <div>Phân quyền</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/user-logs',
    element: (
      <ProtectedRoute requiredPermission="manage_users">
        <div>User Activity Log</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/user-groups',
    element: (
      <ProtectedRoute requiredPermission="manage_users">
        <div>User Groups</div>
      </ProtectedRoute>
    )
  },

  // System Management Routes
  {
    path: '/admin/system',
    element: (
      <ProtectedRoute requiredPermission="manage_system">
        <div>Cấu hình hệ thống</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/logs',
    element: (
      <ProtectedRoute requiredPermission="manage_system">
        <div>Log hệ thống</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/health',
    element: (
      <ProtectedRoute requiredPermission="manage_system">
        <div>System Health</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/database',
    element: (
      <ProtectedRoute requiredPermission="manage_system">
        <div>Database Management</div>
      </ProtectedRoute>
    )
  },

  // Reports Routes
  {
    path: '/admin/reports',
    element: (
      <ProtectedRoute requiredPermission="view_reports">
        <div>Báo cáo tổng quan</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/statistics',
    element: (
      <ProtectedRoute requiredPermission="view_reports">
        <div>Thống kê chi tiết</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/resource-usage',
    element: (
      <ProtectedRoute requiredPermission="view_reports">
        <div>Resource Usage</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/user-analytics',
    element: (
      <ProtectedRoute requiredPermission="view_reports">
        <div>User Analytics</div>
      </ProtectedRoute>
    )
  },

  // Advanced Resource Management
  {
    path: '/admin/resources',
    element: (
      <ProtectedRoute requiredPermission="manage_resources">
        <div>Tất cả tài nguyên</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/resource-categories',
    element: (
      <ProtectedRoute requiredPermission="manage_resources">
        <div>Resource Categories</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/resource-tags',
    element: (
      <ProtectedRoute requiredPermission="manage_resources">
        <div>Resource Tags</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/resource-status',
    element: (
      <ProtectedRoute requiredPermission="manage_resources">
        <div>Resource Status</div>
      </ProtectedRoute>
    )
  },

  // Storage Management
  {
    path: '/admin/storage/usage',
    element: (
      <ProtectedRoute requiredPermission="manage_storage">
        <div>Disk Usage</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/storage/backup',
    element: (
      <ProtectedRoute requiredPermission="manage_storage">
        <div>Backup & Restore</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/storage/cleanup',
    element: (
      <ProtectedRoute requiredPermission="manage_storage">
        <div>Cleanup Tools</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/storage/analytics',
    element: (
      <ProtectedRoute requiredPermission="manage_storage">
        <div>Storage Analytics</div>
      </ProtectedRoute>
    )
  },

  // Security Management
  {
    path: '/admin/security/scan',
    element: (
      <ProtectedRoute requiredPermission="manage_security">
        <div>Virus Scan</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/security/validation',
    element: (
      <ProtectedRoute requiredPermission="manage_security">
        <div>File Validation</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/security/reports',
    element: (
      <ProtectedRoute requiredPermission="manage_security">
        <div>Security Reports</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/security/access',
    element: (
      <ProtectedRoute requiredPermission="manage_security">
        <div>Access Control</div>
      </ProtectedRoute>
    )
  },

  // Integration Routes
  {
    path: '/admin/api',
    element: (
      <ProtectedRoute requiredPermission="manage_integrations">
        <div>API Settings</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/integrations',
    element: (
      <ProtectedRoute requiredPermission="manage_integrations">
        <div>Integrations</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/webhooks',
    element: (
      <ProtectedRoute requiredPermission="manage_integrations">
        <div>Webhooks</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/third-party',
    element: (
      <ProtectedRoute requiredPermission="manage_integrations">
        <div>Third-party Services</div>
      </ProtectedRoute>
    )
  },

  // Monitoring Routes
  {
    path: '/admin/monitoring',
    element: (
      <ProtectedRoute requiredPermission="view_analytics">
        <div>Real-time Monitoring</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/performance',
    element: (
      <ProtectedRoute requiredPermission="view_analytics">
        <div>Performance Metrics</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/errors',
    element: (
      <ProtectedRoute requiredPermission="view_analytics">
        <div>Error Tracking</div>
      </ProtectedRoute>
    )
  },
  {
    path: '/admin/metrics',
    element: (
      <ProtectedRoute requiredPermission="view_analytics">
        <div>System Metrics</div>
      </ProtectedRoute>
    )
  }
];

// ==================== ALL ROUTES ====================
export const allRoutes = [...userRoutes, ...adminRoutes];
