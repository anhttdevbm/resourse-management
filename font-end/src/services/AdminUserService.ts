import axiosInstance from '../configs/axios';
import { handleAxiosError } from '../helpers/axiosHelper';
import { UserUpdatePayload } from '../types/User';

export type AdminUserRecord = {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  permissions: string[];
  is_admin: boolean;
  has_password: boolean;
};

export type AdminUsersPage = {
  users: AdminUserRecord[];
  total: number;
  admin_count: number;
  page: number;
  page_size: number;
};

export type CreateAdminUserPayload = {
  name: string;
  email: string;
  password: string;
};

const listUsers = async (page = 1, pageSize = 10): Promise<AdminUsersPage> => {
  try {
    const response = await axiosInstance.get('/resource-management/users', {
      params: { page, page_size: pageSize },
    });
    if (response.data?.data) {
      return response.data.data as AdminUsersPage;
    }
    return { users: [], total: 0, admin_count: 0, page, page_size: pageSize };
  } catch (error) {
    handleAxiosError(error);
    return { users: [], total: 0, admin_count: 0, page, page_size: pageSize };
  }
};

const getUserById = async (id: string): Promise<AdminUserRecord | null> => {
  try {
    const response = await axiosInstance.get(`/resource-management/users/${id}`);
    return response.data?.data as AdminUserRecord;
  } catch (error) {
    handleAxiosError(error);
    return null;
  }
};

const createUser = async (payload: CreateAdminUserPayload): Promise<AdminUserRecord | null> => {
  try {
    const response = await axiosInstance.post('/resource-management/users', payload);
    return response.data?.data as AdminUserRecord;
  } catch (error) {
    handleAxiosError(error);
    return null;
  }
};

const updateUser = async (id: string, payload: UserUpdatePayload): Promise<AdminUserRecord | null> => {
  try {
    const response = await axiosInstance.put(`/resource-management/users/${id}`, payload);
    return response.data?.data as AdminUserRecord;
  } catch (error) {
    handleAxiosError(error);
    return null;
  }
};

const deleteUser = async (id: string): Promise<boolean> => {
  try {
    const response = await axiosInstance.delete(`/resource-management/users/${id}`);
    return response.data?.code === 'BE0000';
  } catch (error) {
    handleAxiosError(error);
    return false;
  }
};

const listPermissionNames = async (): Promise<string[]> => {
  try {
    const response = await axiosInstance.get('/resource-management/permissions/names');
    return (response.data?.data?.permissions as string[]) ?? [];
  } catch (error) {
    handleAxiosError(error);
    return [];
  }
};

const grantPermission = async (userId: string, permission: string): Promise<AdminUserRecord | null> => {
  try {
    const response = await axiosInstance.post(`/resource-management/users/${userId}/permissions`, {
      permission,
    });
    return response.data?.data as AdminUserRecord;
  } catch (error) {
    handleAxiosError(error);
    return null;
  }
};

const revokePermission = async (userId: string, permission: string): Promise<AdminUserRecord | null> => {
  try {
    const response = await axiosInstance.delete(
      `/resource-management/users/${userId}/permissions/${encodeURIComponent(permission)}`
    );
    return response.data?.data as AdminUserRecord;
  } catch (error) {
    handleAxiosError(error);
    return null;
  }
};

export const AdminUserService = {
  listUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  listPermissionNames,
  grantPermission,
  revokePermission,
};
