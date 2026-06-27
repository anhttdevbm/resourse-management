import axiosInstance from '../configs/axios';
import { handleAxiosError } from '../helpers/axiosHelper';
import { AdminUserRecord } from './AdminUserService';

export type PermissionRecord = {
  id: string;
  name: string;
  created_at?: string | null;
  updated_at?: string | null;
  user_count: number;
  is_protected: boolean;
};

export type PermissionsListResponse = {
  permissions: PermissionRecord[];
  total: number;
};

const listPermissions = async (): Promise<PermissionsListResponse> => {
  try {
    const response = await axiosInstance.get('/resource-management/permissions');
    const data = response.data?.data;
    return {
      permissions: (data?.permissions as PermissionRecord[]) ?? [],
      total: data?.total ?? 0,
    };
  } catch (error) {
    handleAxiosError(error);
    return { permissions: [], total: 0 };
  }
};

const createPermission = async (name: string): Promise<PermissionRecord | null> => {
  try {
    const response = await axiosInstance.post('/resource-management/permissions', { name });
    return response.data?.data as PermissionRecord;
  } catch (error) {
    handleAxiosError(error);
    return null;
  }
};

const updatePermission = async (id: string, name: string): Promise<PermissionRecord | null> => {
  try {
    const response = await axiosInstance.put(`/resource-management/permissions/${id}`, { name });
    return response.data?.data as PermissionRecord;
  } catch (error) {
    handleAxiosError(error);
    return null;
  }
};

const deletePermission = async (id: string): Promise<boolean> => {
  try {
    const response = await axiosInstance.delete(`/resource-management/permissions/${id}`);
    return response.data?.code === 'BE0000';
  } catch (error) {
    handleAxiosError(error);
    return false;
  }
};

const listPermissionUsers = async (permissionId: string): Promise<AdminUserRecord[]> => {
  try {
    const response = await axiosInstance.get(
      `/resource-management/permissions/${permissionId}/users`
    );
    return (response.data?.data?.users as AdminUserRecord[]) ?? [];
  } catch (error) {
    handleAxiosError(error);
    return [];
  }
};

export const SUGGESTED_PERMISSIONS = [
  'AllAccess',
  'view_resources',
  'upload_resources',
  'manage_resources',
  'manage_users',
  'manage_system',
  'view_reports',
  'manage_uploads',
  'view_categories',
  'manage_storage',
  'manage_security',
];

export const AdminPermissionService = {
  listPermissions,
  createPermission,
  updatePermission,
  deletePermission,
  listPermissionUsers,
};
