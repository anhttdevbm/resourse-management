import { apiCall } from '../configs/axios';
import type { Resource, ResourceFilters, ResourceShareInfo } from './ResourceService';

export interface ResourceOwner {
  id: string;
  name: string;
  email: string;
}

export interface AdminResource extends Resource {
  owner?: ResourceOwner;
  resource_stage?: { id: string; name: string };
}

export type AdminResourceFilters = ResourceFilters & {
  include_deleted?: boolean;
};

const prefix = '/resource-management/admin/resources';

export const AdminResourceService = {
  async listAll(filters?: AdminResourceFilters): Promise<AdminResource[]> {
    const params: Record<string, string | boolean> = {};
    if (filters) {
      if (filters.id) params.id = filters.id;
      if (filters.name) params.name = filters.name;
      if (filters.version) params.version = filters.version;
      if (filters.stage_id) params.stage_id = filters.stage_id;
      if (filters.status_id) params.status_id = filters.status_id;
      if (filters.platform_id) params.platform_id = filters.platform_id;
      if (filters.product_type_id) params.product_type_id = filters.product_type_id;
      if (filters.repo_id) params.repo_id = filters.repo_id;
      if (filters.tag_id) params.tag_id = filters.tag_id;
      if (filters.include_deleted) params.include_deleted = true;
    }
    const response = await apiCall.get<{ code: string; data: AdminResource[] }>(`${prefix}/`, {
      params,
    });
    if (response.data?.code === 'BE0000') {
      return response.data.data || [];
    }
    return [];
  },

  async update(resourceId: string, payload: Partial<AdminResource>): Promise<AdminResource | null> {
    const response = await apiCall.put<{ code: string; data: AdminResource }>(
      `${prefix}/${resourceId}`,
      payload
    );
    if (response.data?.code === 'BE0000') {
      return response.data.data;
    }
    return null;
  },

  async delete(resourceId: string): Promise<boolean> {
    const response = await apiCall.delete<{ code: string }>(`${prefix}/${resourceId}`);
    return response.data?.code === 'BE0000';
  },

  async restore(resourceId: string): Promise<AdminResource | null> {
    const response = await apiCall.post<{ code: string; data: AdminResource }>(
      `${prefix}/${resourceId}/restore`
    );
    if (response.data?.code === 'BE0000') {
      return response.data.data;
    }
    return null;
  },

  async getShares(resourceId: string): Promise<ResourceShareInfo[]> {
    const response = await apiCall.get<{ code: string; data: ResourceShareInfo[] }>(
      `/resource-management/resources/${resourceId}/shares`
    );
    if (response.data?.code === 'BE0000') {
      return response.data.data || [];
    }
    return [];
  },
};
