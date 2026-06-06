import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const AdminMenu: React.FC = () => {
  const { isAdmin, hasPermission } = useAuth();

  if (!isAdmin) return null;

  return (
    <div className="admin-menu">
      <h3>Admin Panel</h3>
      <ul>
        {hasPermission('manage_users') && (
          <li>
            <Link to="/admin/users">Quản lý người dùng</Link>
          </li>
        )}
        {hasPermission('manage_system') && (
          <li>
            <Link to="/admin/system">Quản lý hệ thống</Link>
          </li>
        )}
        {hasPermission('view_reports') && (
          <li>
            <Link to="/admin/reports">Báo cáo</Link>
          </li>
        )}
        <li>
          <Link to="/admin/settings">Cài đặt</Link>
        </li>
      </ul>
    </div>
  );
}; 