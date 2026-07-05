import { createRoot } from 'react-dom/client'
import './index.css'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import User from './pages/user/user/View.tsx'
import Layout from './components/layout'
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom"
import {
  QueryClient,
  QueryClientProvider,
} from 'react-query'
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import { store } from './redux/store'
import { Provider } from "react-redux";
import AuthMiddleware from './middleware/AuthMiddleware'
import LoginMiddleware from './middleware/NoAuthMiddleware'
import {ReactQueryDevtools} from 'react-query/devtools'
import { AuthProvider } from './contexts/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import Unauthorized from './pages/Unauthorized'
import AdminUsers from './pages/admin/Users'
import AdminPermissions from './pages/admin/Permissions'
import AdminSystem from './pages/admin/System'
import AdminReports from './pages/admin/Reports'
import AdminResources from './pages/admin/Resources'
import ForgotPassword from './components/ForgotPassword/ForgotPassword.jsx'
import ResetPassword from './components/ResetPassword/ResetPassword.jsx'
import NotificationsPage from './pages/Notifications'
import EditProfile from './pages/EditProfile'
import Profile from './pages/Profile'
import ChangePassword from './pages/ChangePassword'
import ProfileSettings from './pages/ProfileSettings'
import Downloads from './pages/Downloads'
import Activity from './pages/Activity'
import Resources from './pages/Resources'
import DownloadedResources from './pages/DownloadedResources'
import ResourceFavorites from './pages/ResourceFavorites'
import ResourceBookmarks from './pages/ResourceBookmarks'
import ResourceUpload from './pages/ResourceUpload'
import ResourceDetail from './pages/ResourceDetail'
import ResourceEdit from './pages/ResourceEdit'
import UploadHistory from './pages/UploadHistory'
import UploadQueue from './pages/UploadQueue'
import ApkFiles from './pages/ApkFiles'
import ExeFiles from './pages/ExeFiles'
import IsoFiles from './pages/IsoFiles'
import OtherFiles from './pages/OtherFiles'
import SearchPage from './pages/Search'
import SearchHistory from './pages/SearchHistory'
import Categories from './pages/Categories'
import CategoryTags from './pages/CategoryTags'
import CategoryAutoClassification from './pages/CategoryAutoClassification'
import FiltersPage from './pages/Filters'

const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <LoginMiddleware>
        <Login />
      </LoginMiddleware>
    )
  },
  {
    path: "/unauthorized",
    element: <Unauthorized />
  },
  {
    path: "/forgot-password",
    element: (
      <LoginMiddleware>
        <ForgotPassword />
      </LoginMiddleware>
    )
  },
  {
    path: "/reset-password",
    element: (
      <LoginMiddleware>
        <ResetPassword />
      </LoginMiddleware>
    )
  },
  {
    path: "/",
    element: (
      <AuthMiddleware>
        <Layout />
      </AuthMiddleware>
    ),
    children: [
      { 
        path: '/dashboard', 
        element: (
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        ) 
      },
      {
        path: '/search',
        element: (
          <ProtectedRoute>
            <SearchPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/search/history',
        element: (
          <ProtectedRoute>
            <SearchHistory />
          </ProtectedRoute>
        )
      },
      {
        path: '/filters',
        element: (
          <ProtectedRoute>
            <FiltersPage />
          </ProtectedRoute>
        )
      },
      { 
        path: '/dashboard/downloads', 
        element: (
          <ProtectedRoute>
            <Downloads />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/dashboard/activity', 
        element: (
          <ProtectedRoute>
            <Activity />
          </ProtectedRoute>
        ) 
      },
      { 
        path: '/user/index', 
        element: (
          <ProtectedRoute>
            <User />
          </ProtectedRoute>
        ) 
      },
      // Resource Management Routes
      {
        path: '/resources',
        element: (
          <ProtectedRoute>
            <Resources />
          </ProtectedRoute>
        )
      },
      {
        path: '/resources/add',
        element: (
          <ProtectedRoute requiredPermission="manage_resources">
            <div>Thêm tài nguyên mới</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/resources/categories',
        element: (
          <ProtectedRoute requiredPermission="manage_resources">
            <div>Phân loại tài nguyên</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/resources/downloaded',
        element: (
          <ProtectedRoute>
            <DownloadedResources />
          </ProtectedRoute>
        )
      },
      {
        path: '/my-downloads',
        element: (
          <ProtectedRoute>
            <DownloadedResources />
          </ProtectedRoute>
        )
      },
      {
        path: '/resources/favorites',
        element: (
          <ProtectedRoute>
            <ResourceFavorites />
          </ProtectedRoute>
        )
      },
      {
        path: '/my-favorites',
        element: (
          <ProtectedRoute>
            <ResourceFavorites />
          </ProtectedRoute>
        )
      },
      {
        path: '/my-bookmarks',
        element: (
          <ProtectedRoute>
            <ResourceBookmarks />
          </ProtectedRoute>
        )
      },
      {
        path: '/resources/upload',
        element: (
          <ProtectedRoute>
            <ResourceUpload />
          </ProtectedRoute>
        )
      },
      {
        path: '/resources/:id/edit',
        element: (
          <ProtectedRoute>
            <ResourceEdit />
          </ProtectedRoute>
        )
      },
      {
        path: '/resources/:id',
        element: (
          <ProtectedRoute>
            <ResourceDetail />
          </ProtectedRoute>
        )
      },
      // File Types Routes
      {
        path: '/file-types/apk',
        element: (
          <ProtectedRoute>
            <ApkFiles />
          </ProtectedRoute>
        )
      },
      {
        path: '/file-types/exe',
        element: (
          <ProtectedRoute>
            <ExeFiles />
          </ProtectedRoute>
        )
      },
      {
        path: '/file-types/iso',
        element: (
          <ProtectedRoute>
            <IsoFiles />
          </ProtectedRoute>
        )
      },
      {
        path: '/file-types/others',
        element: (
          <ProtectedRoute>
            <OtherFiles />
          </ProtectedRoute>
        )
      },
      // Upload Management Routes
      {
        path: '/uploads',
        element: (
          <ProtectedRoute requiredPermission="manage_uploads">
            <div>Upload tài nguyên</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/uploads/approval',
        element: (
          <ProtectedRoute requiredPermission="manage_uploads">
            <div>Kiểm duyệt file</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/uploads/history',
        element: (
          <ProtectedRoute>
            <UploadHistory />
          </ProtectedRoute>
        )
      },
      {
        path: '/uploads/queue',
        element: (
          <ProtectedRoute>
            <UploadQueue />
          </ProtectedRoute>
        )
      },
      // Storage Management Routes
      {
        path: '/storage',
        element: (
          <ProtectedRoute requiredPermission="manage_storage">
            <div>Storage Overview</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/storage/backup',
        element: (
          <ProtectedRoute requiredPermission="manage_storage">
            <div>Backup & Restore</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/storage/cleanup',
        element: (
          <ProtectedRoute requiredPermission="manage_storage">
            <div>Cleanup Tools</div>
          </ProtectedRoute>
        )
      },
      // Categories Routes (align with role-based-menu + backend permission name: view_categories)
      {
        path: '/categories',
        element: (
          <ProtectedRoute requiredPermission="view_categories">
            <Categories />
          </ProtectedRoute>
        )
      },
      {
        path: '/categories/tags',
        element: (
          <ProtectedRoute requiredPermission="view_categories">
            <CategoryTags />
          </ProtectedRoute>
        )
      },
      {
        path: '/categories/auto',
        element: (
          <ProtectedRoute requiredPermission="view_categories">
            <CategoryAutoClassification />
          </ProtectedRoute>
        )
      },
      // Security Routes
      {
        path: '/security/scan',
        element: (
          <ProtectedRoute requiredPermission="manage_security">
            <div>Virus Scan</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/security/validation',
        element: (
          <ProtectedRoute requiredPermission="manage_security">
            <div>File Validation</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/security/reports',
        element: (
          <ProtectedRoute requiredPermission="manage_security">
            <div>Security Reports</div>
          </ProtectedRoute>
        )
      },
      // User Management Routes
      {
        path: '/user',
        element: (
          <ProtectedRoute requiredPermission="manage_users">
            <div>Danh sách thành viên</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/user/catalogue',
        element: (
          <ProtectedRoute requiredPermission="manage_users">
            <div>Nhóm thành viên</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/user/permissions',
        element: (
          <ProtectedRoute requiredPermission="manage_users">
            <div>Phân quyền truy cập</div>
          </ProtectedRoute>
        )
      },
      // Reports Routes
      {
        path: '/reports',
        element: (
          <ProtectedRoute requiredPermission="view_reports">
            <div>Báo cáo tổng hợp</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/reports/downloads',
        element: (
          <ProtectedRoute requiredPermission="view_reports">
            <div>Thống kê tải xuống</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/reports/analytics',
        element: (
          <ProtectedRoute requiredPermission="view_reports">
            <div>Analytics</div>
          </ProtectedRoute>
        )
      },
      // Activity Routes
      {
        path: '/activity',
        element: (
          <ProtectedRoute requiredPermission="view_activity">
            <div>Lịch sử hoạt động</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/activity/users',
        element: (
          <ProtectedRoute requiredPermission="view_activity">
            <div>User Activity</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/activity/logs',
        element: (
          <ProtectedRoute requiredPermission="view_activity">
            <div>System Logs</div>
          </ProtectedRoute>
        )
      },
      // Settings Routes
      {
        path: '/settings',
        element: (
          <ProtectedRoute>
            <div>Cài đặt chung</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/profile',
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        )
      },
      {
        path: '/profile/edit',
        element: (
          <ProtectedRoute>
            <EditProfile />
          </ProtectedRoute>
        )
      },
      {
        path: '/profile/password',
        element: (
          <ProtectedRoute>
            <ChangePassword />
          </ProtectedRoute>
        )
      },
      {
        path: '/profile/settings',
        element: (
          <ProtectedRoute>
            <ProfileSettings />
          </ProtectedRoute>
        )
      },
      {
        path: '/settings/system',
        element: (
          <ProtectedRoute>
            <div>System Configuration</div>
          </ProtectedRoute>
        )
      },
      // Notifications Routes
      {
        path: '/notifications',
        element: (
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        )
      },
      {
        path: '/notifications/settings',
        element: (
          <ProtectedRoute>
            <div>Cài đặt thông báo</div>
          </ProtectedRoute>
        )
      },
      {
        path: '/notifications/history',
        element: (
          <ProtectedRoute>
            <div>Alert History</div>
          </ProtectedRoute>
        )
      },
      // Admin Routes
      {
        path: '/admin/users',
        element: (
          <ProtectedRoute requiredPermission="manage_users">
            <AdminUsers />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/system',
        element: (
          <ProtectedRoute requiredPermission="manage_system">
            <AdminSystem />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/reports',
        element: (
          <ProtectedRoute requiredPermission="view_reports">
            <AdminReports />
          </ProtectedRoute>
        )
      },
      {
        path: '/admin/permissions',
        element: (
          <ProtectedRoute requiredPermission="manage_users">
            <AdminPermissions />
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
        path: '/admin/resources',
        element: (
          <ProtectedRoute requiredPermission="manage_resources">
            <AdminResources />
          </ProtectedRoute>
        )
      }
    ]
  }
])

const queryClient = new QueryClient();

createRoot(document.getElementById('root')!).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <ToastContainer />
        <ReactQueryDevtools initialIsOpen={false} position='bottom-right'/>
      </AuthProvider>
    </QueryClientProvider>
  </Provider>
)
