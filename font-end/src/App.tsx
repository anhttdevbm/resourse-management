import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import Dashboard from './pages/Dashboard';
import Login from './pages/auth/Login';
import Unauthorized from './pages/Unauthorized';
import AdminUsers from './pages/admin/Users';
import AdminPermissions from './pages/admin/Permissions';
import AdminSystem from './pages/admin/System';
import AdminReports from './pages/admin/Reports';
import NotificationsPage from './pages/Notifications';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* User routes */}
          <Route path="/user" element={
            <ProtectedRoute requiredPermission="manage_users">
              <div>Quản lý thành viên</div>
            </ProtectedRoute>
          } />
          
          <Route path="/user/catalogue" element={
            <ProtectedRoute requiredPermission="manage_users">
              <div>Nhóm thành viên</div>
            </ProtectedRoute>
          } />
          
          <Route path="/resources" element={
            <ProtectedRoute requiredPermission="manage_resources">
              <div>Quản lý tài nguyên</div>
            </ProtectedRoute>
          } />
          
          <Route path="/resources/types" element={
            <ProtectedRoute requiredPermission="manage_resources">
              <div>Loại tài nguyên</div>
            </ProtectedRoute>
          } />
          
          <Route path="/resources/status" element={
            <ProtectedRoute requiredPermission="manage_resources">
              <div>Trạng thái tài nguyên</div>
            </ProtectedRoute>
          } />
          
          <Route path="/reports" element={
            <ProtectedRoute requiredPermission="view_reports">
              <div>Báo cáo tổng hợp</div>
            </ProtectedRoute>
          } />
          
          <Route path="/reports/detail" element={
            <ProtectedRoute requiredPermission="view_reports">
              <div>Báo cáo chi tiết</div>
            </ProtectedRoute>
          } />
          
          <Route path="/settings" element={
            <ProtectedRoute>
              <div>Cài đặt chung</div>
            </ProtectedRoute>
          } />
          
          <Route path="/profile" element={
            <ProtectedRoute>
              <div>Hồ sơ cá nhân</div>
            </ProtectedRoute>
          } />
          
          <Route path="/notifications" element={
            <ProtectedRoute>
              <NotificationsPage />
            </ProtectedRoute>
          } />
          
          <Route path="/notifications/settings" element={
            <ProtectedRoute>
              <div>Cài đặt thông báo</div>
            </ProtectedRoute>
          } />
          
          {/* Admin routes */}
          <Route path="/admin/users" element={
            <ProtectedRoute requiredPermission="manage_users">
              <AdminUsers />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/system" element={
            <ProtectedRoute requiredPermission="manage_system">
              <AdminSystem />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/reports" element={
            <ProtectedRoute requiredPermission="view_reports">
              <AdminReports />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/permissions" element={
            <ProtectedRoute requiredPermission="manage_users">
              <AdminPermissions />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/logs" element={
            <ProtectedRoute requiredPermission="manage_system">
              <div>Log hệ thống</div>
            </ProtectedRoute>
          } />
          
          <Route path="/admin/statistics" element={
            <ProtectedRoute requiredPermission="view_reports">
              <div>Thống kê chi tiết</div>
            </ProtectedRoute>
          } />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App; 