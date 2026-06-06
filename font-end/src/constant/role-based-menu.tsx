import { 
  FaHome, FaCog, FaChartBar, FaUsers,
  FaDownload, FaUpload, FaFileCode, FaShieldAlt, FaTags,
  FaHistory, FaDatabase, FaServer, FaEye,
  FaSearch, FaNetworkWired
} from "react-icons/fa";
import { userHasAdminAccess } from '../utils/isAdminUser';
import type { User } from '../types/User';

// ==================== USER MENU ====================
export const userMenuItems = [
  {
    label: 'i18n:menu.group.dashboard',
    items: [
      {
        icon: <FaHome className="text-sm mr-2" />,
        active: ['dashboard'],
        label: 'i18n:menu.item.home',
        links: [
          { title: 'i18n:menu.link.systemOverview', to: '/dashboard' },
          { title: 'i18n:menu.link.downloadStats', to: '/dashboard/downloads' },
          { title: 'i18n:menu.link.recentActivity', to: '/dashboard/activity' }
        ]
      }
    ]
  },
  {
    label: 'i18n:menu.group.resources',
    items: [
      {
        icon: <FaDownload className="text-sm mr-2" />,
        active: ['resources'],
        label: 'i18n:menu.item.myResources',
        links: [
          { title: 'i18n:menu.link.resourceList', to: '/resources' },
          { title: 'i18n:menu.link.downloadedResources', to: '/resources/downloaded' },
          { title: 'i18n:menu.link.favoriteResources', to: '/resources/favorites' }
        ]
      },
      {
        icon: <FaUpload className="text-sm mr-2" />,
        active: ['uploads'],
        label: 'i18n:menu.item.upload',
        permission: 'upload_resources',
        links: [
          { title: 'i18n:menu.link.newUpload', to: '/resources/upload' },
          { title: 'i18n:menu.link.uploadHistory', to: '/uploads/history' },
          { title: 'i18n:menu.link.processingQueue', to: '/uploads/queue' }
        ]
      },
      {
        icon: <FaFileCode className="text-sm mr-2" />,
        active: ['file-types'],
        label: 'i18n:menu.item.fileTypes',
        permission: 'view_file_types',
        links: [
          { title: 'APK Files', to: '/file-types/apk' },
          { title: 'EXE Files', to: '/file-types/exe' },
          { title: 'ISO Files', to: '/file-types/iso' },
          { title: 'Other Files', to: '/file-types/others' }
        ]
      }
    ]
  },
  {
    label: 'i18n:menu.group.searchAndCategories',
    items: [
      {
        icon: <FaSearch className="text-sm mr-2" />,
        active: ['search'],
        label: 'i18n:menu.item.search',
        links: [
          { title: 'i18n:menu.link.advancedSearch', to: '/search' },
          { title: 'i18n:menu.link.filters', to: '/filters' },
          { title: 'i18n:menu.link.searchHistory', to: '/search/history' }
        ]
      },
      {
        icon: <FaTags className="text-sm mr-2" />,
        active: ['categories'],
        label: 'i18n:menu.item.categories',
        permission: 'view_categories',
        links: [
          { title: 'i18n:menu.link.mainCategories', to: '/categories' },
          { title: 'Tags & Labels', to: '/categories/tags' },
          { title: 'Auto Classification', to: '/categories/auto' }
        ]
      }
    ]
  },
  {
    label: 'i18n:menu.group.personal',
    items: [
      {
        icon: <FaUsers className="text-sm mr-2" />,
        active: ['profile'],
        label: 'i18n:menu.item.profile',
        links: [
          { title: 'Profile', to: '/profile' },
          { title: 'i18n:menu.link.changePassword', to: '/profile/password' },
          { title: 'i18n:menu.link.settings', to: '/profile/settings' }
        ]
      },
      {
        icon: <FaHistory className="text-sm mr-2" />,
        active: ['/activity', '/my-downloads', '/my-favorites', '/my-bookmarks'],
        label: 'i18n:menu.item.activity',
        links: [
          { title: 'i18n:menu.link.downloadHistory', to: '/my-downloads' },
          { title: 'Favorites', to: '/my-favorites' },
          { title: 'i18n:menu.link.bookmarks', to: '/my-bookmarks' }
        ]
      }
    ]
  }
];

// ==================== ADMIN MENU ====================
export const adminMenuItems = [
  {
    label: 'i18n:menu.group.adminPanel',
    items: [
      {
        icon: <FaUsers className="text-sm mr-2" />,
        active: ['admin-users'],
        label: 'i18n:menu.item.adminUsers',
        permission: 'manage_users',
        links: [
          { title: 'i18n:menu.link.userList', to: '/admin/users' },
          { title: 'i18n:menu.link.permissions', to: '/admin/permissions' },
          { title: 'User Activity Log', to: '/admin/user-logs' },
          { title: 'User Groups', to: '/admin/user-groups' }
        ]
      },
      {
        icon: <FaCog className="text-sm mr-2" />,
        active: ['admin-system'],
        label: 'i18n:menu.item.adminSystem',
        permission: 'manage_system',
        links: [
          { title: 'i18n:menu.link.systemConfig', to: '/admin/system' },
          { title: 'i18n:menu.link.systemLogs', to: '/admin/logs' },
          { title: 'System Health', to: '/admin/health' },
          { title: 'Database Management', to: '/admin/database' }
        ]
      },
      {
        icon: <FaChartBar className="text-sm mr-2" />,
        active: ['admin-reports'],
        label: 'i18n:menu.item.adminReports',
        permission: 'view_reports',
        links: [
          { title: 'i18n:menu.link.overviewReports', to: '/admin/reports' },
          { title: 'i18n:menu.link.detailedStats', to: '/admin/statistics' },
          { title: 'Resource Usage', to: '/admin/resource-usage' },
          { title: 'User Analytics', to: '/admin/user-analytics' }
        ]
      }
    ]
  },
  {
    label: 'i18n:menu.group.advancedResourceAdmin',
    items: [
      {
        icon: <FaDatabase className="text-sm mr-2" />,
        active: ['admin-resources'],
        label: 'i18n:menu.item.adminResources',
        permission: 'manage_resources',
        links: [
          { title: 'i18n:menu.link.allResources', to: '/admin/resources' },
          { title: 'Resource Categories', to: '/admin/resource-categories' },
          { title: 'Resource Tags', to: '/admin/resource-tags' },
          { title: 'Resource Status', to: '/admin/resource-status' }
        ]
      },
      {
        icon: <FaServer className="text-sm mr-2" />,
        active: ['admin-storage'],
        label: 'i18n:menu.item.adminStorage',
        permission: 'manage_storage',
        links: [
          { title: 'Disk Usage', to: '/admin/storage/usage' },
          { title: 'Backup & Restore', to: '/admin/storage/backup' },
          { title: 'Cleanup Tools', to: '/admin/storage/cleanup' },
          { title: 'Storage Analytics', to: '/admin/storage/analytics' }
        ]
      },
      {
        icon: <FaShieldAlt className="text-sm mr-2" />,
        active: ['admin-security'],
        label: 'i18n:menu.item.adminSecurity',
        permission: 'manage_security',
        links: [
          { title: 'Virus Scan', to: '/admin/security/scan' },
          { title: 'File Validation', to: '/admin/security/validation' },
          { title: 'Security Reports', to: '/admin/security/reports' },
          { title: 'Access Control', to: '/admin/security/access' }
        ]
      }
    ]
  },
  {
    label: 'i18n:menu.group.advancedConfig',
    items: [
      {
        icon: <FaNetworkWired className="text-sm mr-2" />,
        active: ['admin-integrations'],
        label: 'i18n:menu.item.integrations',
        permission: 'manage_integrations',
        links: [
          { title: 'API Settings', to: '/admin/api' },
          { title: 'Integrations', to: '/admin/integrations' },
          { title: 'Webhooks', to: '/admin/webhooks' },
          { title: 'Third-party Services', to: '/admin/third-party' }
        ]
      },
      {
        icon: <FaEye className="text-sm mr-2" />,
        active: ['admin-monitoring'],
        label: 'i18n:menu.item.monitoring',
        permission: 'view_analytics',
        links: [
          { title: 'Real-time Monitoring', to: '/admin/monitoring' },
          { title: 'Performance Metrics', to: '/admin/performance' },
          { title: 'Error Tracking', to: '/admin/errors' },
          { title: 'System Metrics', to: '/admin/metrics' }
        ]
      }
    ]
  }
];

// ==================== PERMISSION MAPPING ====================
export const permissionMapping = {
  // User permissions
  'view_resources': 'Xem tài nguyên',
  'upload_resources': 'Upload tài nguyên',
  'view_file_types': 'Xem loại file',
  'view_categories': 'Xem danh mục',
  
  // Admin permissions
  'manage_users': 'Quản lý người dùng',
  'manage_system': 'Quản lý hệ thống',
  'view_reports': 'Xem báo cáo',
  'manage_resources': 'Quản lý tài nguyên',
  'manage_storage': 'Quản lý storage',
  'manage_security': 'Quản lý bảo mật',
  'manage_integrations': 'Quản lý tích hợp',
  'view_analytics': 'Xem analytics'
};

// ==================== ROLE DETECTION ====================
export const getMenuByRole = (user: User | null) => {
  if (userHasAdminAccess(user)) {
    return [...userMenuItems, ...adminMenuItems];
  }
  return userMenuItems;
};

// ==================== PERMISSION CHECK ====================
export const hasPermission = (requiredPermission: string, user: User | null): boolean => {
  if (userHasAdminAccess(user)) return true;
  return (user?.permissions ?? []).includes(requiredPermission);
};
