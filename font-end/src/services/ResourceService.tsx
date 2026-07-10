import { apiCall } from '../configs/axios';
import { getApiErrorMessage } from '../helpers/axiosHelper';

export interface Resource {
  id: string;
  name: string;
  version: string;
  url: string;
  created_at: string;
  stage_id?: string;
  status_id?: string;
  platform_id?: string;
  product_type_id?: string;
  repo_id?: string;
  tag_id?: string;
  user_id?: string;
  is_deleted?: boolean;
  resource_status?: {
    id: string;
    name: string;
  };
  resource_stage?: {
    id: string;
    name: string;
  };
  resource_platform?: {
    id: string;
    name: string;
  };
  product_type?: {
    id: string;
    name: string;
  };
  package_repo?: {
    id: string;
    name: string;
  };
  resource_tags?: Array<{
    id: string;
    name: string;
  }>;
}

export interface ResourceFilters {
  id?: string;
  name?: string;
  version?: string;
  stage_id?: string;
  status_id?: string;
  platform_id?: string;
  product_type_id?: string;
  repo_id?: string;
  tag_id?: string;
}

export interface ResourceResponse {
  code: string;
  data: Resource[];
  message?: string;
}

/** Option item for dropdowns (stage, status, platform, product type, repo, tag) */
export interface ResourceOption {
  id: string;
  name: string;
}

export interface ResourceUploadOptions {
  stages: ResourceOption[];
  statuses: ResourceOption[];
  platforms: ResourceOption[];
  productTypes: ResourceOption[];
  repos: ResourceOption[];
  tags: ResourceOption[];
}

export interface ResourceShareInfo {
  id: string;
  user_id: string;
  email: string;
  name?: string | null;
  can_edit: boolean;
  created_at: string;
}

function dictToOptions(data: Record<string, { id?: string; name?: string }> | null | undefined): ResourceOption[] {
  if (!data || typeof data !== 'object') return [];
  return Object.values(data).map((item) => ({
    id: String(item?.id ?? ''),
    name: String(item?.name ?? ''),
  })).filter((o) => o.id && o.name && isValidUuid(o.id));
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const FK_UUID_FIELDS = [
  'stage_id',
  'status_id',
  'platform_id',
  'product_type_id',
  'repo_id',
  'tag_id',
] as const;

export function isValidUuid(value: string | undefined | null): boolean {
  if (!value || typeof value !== 'string') return false;
  const trimmed = value.trim();
  return trimmed.length > 0 && UUID_RE.test(trimmed);
}

/** Chỉ gửi FK khi là UUID hợp lệ — tránh 500 từ backend khi parse. */
function sanitizeResourceUpdate(updateData: Partial<Resource>): Partial<Resource> {
  const out: Partial<Resource> = { ...updateData };
  for (const key of FK_UUID_FIELDS) {
    const v = out[key];
    if (v != null && v !== '' && !isValidUuid(String(v))) {
      delete out[key];
    }
  }
  return out;
}

export const ResourceService = {
  /**
   * Get all resources with optional filters
   */
  async getResources(filters?: ResourceFilters): Promise<Resource[]> {
    try {
      console.log('🔄 Fetching resources with filters:', filters);
      
      // Build params object - only include fields that have values
      // Backend now uses Query() parameters, so all fields are truly optional
      const params: any = {};
      
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
      }
      
      const response = await apiCall.get<ResourceResponse>('/resource-management/resources/', {
        params: params,
      });
      
      console.log('📊 Resources API response:', response.data);
      
      if (response.data && response.data.code === 'BE0000') {
        return response.data.data || [];
      }
      
      return [];
    } catch (error) {
      console.error('❌ Error fetching resources:', error);
      throw error;
    }
  },

  /**
   * Get a single resource by ID
   */
  async getResourceById(resourceId: string): Promise<Resource | null> {
    try {
      const response = await apiCall.get<ResourceResponse>(`/resource-management/resources/${resourceId}`);
      
      if (response.data && response.data.code === 'BE0000') {
        return response.data.data as any;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error fetching resource:', error);
      throw error;
    }
  },

  /**
   * Delete a resource
   */
  async deleteResource(resourceId: string): Promise<boolean> {
    try {
      const response = await apiCall.delete(`/resource-management/resource/${resourceId}`);
      
      if (response.data && response.data.code === 'BE0000') {
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('❌ Error deleting resource:', error);
      throw error;
    }
  },

  /**
   * Update a resource
   */
  async updateResource(resourceId: string, updateData: Partial<Resource>): Promise<Resource | null> {
    try {
      const payload = sanitizeResourceUpdate(updateData);
      const response = await apiCall.put(`/resource-management/resources/${resourceId}`, payload);
      
      if (response.data && response.data.code === 'BE0000') {
        return response.data.data as any;
      }
      
      return null;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string; code?: string } | string } };
      const raw = err?.response?.data;
      const msg = typeof raw === 'string' ? raw : raw?.message;
      const code = typeof raw === 'string' ? undefined : raw?.code;
      console.error('❌ Error updating resource:', code, msg, error);
      throw new Error(msg || 'Cập nhật thất bại');
    }
  },

  /**
   * Create a new package repository (Kho). Any logged-in user can create their own.
   */
  async createPackageRepository(name: string): Promise<ResourceOption> {
    const response = await apiCall.post<{ code: string; data?: { id: string; name: string } }>(
      '/resource-management/package_repository',
      { name: name.trim() }
    );
    if (response.data?.code === 'BE0000' && response.data?.data) {
      const d = response.data.data;
      return { id: String(d.id), name: String(d.name) };
    }
    throw new Error((response.data as any)?.message || 'Tạo kho thất bại');
  },

  /**
   * Create a new resource tag (Thẻ). Any logged-in user can create their own.
   */
  async createResourceTag(name: string): Promise<ResourceOption> {
    const response = await apiCall.post<{ code: string; data?: { id: string; name: string } }>(
      '/resource-management/resource_tags',
      { name: name.trim() }
    );
    if (response.data?.code === 'BE0000' && response.data?.data) {
      const d = response.data.data;
      return { id: String(d.id), name: String(d.name) };
    }
    throw new Error((response.data as any)?.message || 'Tạo thẻ thất bại');
  },

  /**
   * Get options for upload form (stages, statuses, platforms, product types, repos, tags)
   */
  async getResourceUploadOptions(): Promise<ResourceUploadOptions> {
    const prefix = '/resource-management';
    const empty: ResourceUploadOptions = {
      stages: [],
      statuses: [],
      platforms: [],
      productTypes: [],
      repos: [],
      tags: [],
    };
    try {
      const [stagesRes, statusesRes, platformsRes, productTypesRes, reposRes, tagsRes] = await Promise.allSettled([
        apiCall.get<{ code: string; data?: Record<string, { id: string; name: string }> }>(`${prefix}/resource_stages`),
        apiCall.get<{ code: string; data?: Record<string, { id: string; name: string }> }>(`${prefix}/resource_statuss`),
        apiCall.get<{ code: string; data?: Record<string, { id: string; name: string }> }>(`${prefix}/resource_platforms`),
        apiCall.get<{ code: string; data?: Record<string, { id: string; name: string }> }>(`${prefix}/produce_types`),
        apiCall.get<{ code: string; data?: Record<string, { id: string; name: string }> }>(`${prefix}/package_repositories`),
        apiCall.get<{ code: string; data?: Record<string, { id: string; name: string }> }>(`${prefix}/resource_tags`),
      ]);
      return {
        stages: stagesRes.status === 'fulfilled' && stagesRes.value.data?.code === 'BE0000' ? dictToOptions(stagesRes.value.data.data) : [],
        statuses: statusesRes.status === 'fulfilled' && statusesRes.value.data?.code === 'BE0000' ? dictToOptions(statusesRes.value.data.data) : [],
        platforms: platformsRes.status === 'fulfilled' && platformsRes.value.data?.code === 'BE0000' ? dictToOptions(platformsRes.value.data.data) : [],
        productTypes: productTypesRes.status === 'fulfilled' && productTypesRes.value.data?.code === 'BE0000' ? dictToOptions(productTypesRes.value.data.data) : [],
        repos: reposRes.status === 'fulfilled' && reposRes.value.data?.code === 'BE0000' ? dictToOptions(reposRes.value.data.data) : [],
        tags: tagsRes.status === 'fulfilled' && tagsRes.value.data?.code === 'BE0000' ? dictToOptions(tagsRes.value.data.data) : [],
      };
    } catch {
      return empty;
    }
  },

  /**
   * Get resource file as Blob (for preview, e.g. images). Does not trigger download.
   */
  async getResourceBlob(resourceId: string): Promise<Blob> {
    const presign = await ResourceService.getDownloadUrl(resourceId);
    const response = await fetch(presign.url);
    if (!response.ok) {
      throw new Error('Không thể tải nội dung tài nguyên.');
    }
    return response.blob();
  },

  /**
   * Lấy URL MinIO tạm (presigned) sau khi API kiểm tra quyền + ghi log.
   */
  async getDownloadUrl(
    resourceId: string
  ): Promise<{ url: string; expires_in: number; filename: string; resource_id: string }> {
    const response = await apiCall.get<{
      code: string;
      data?: { url: string; expires_in: number; filename: string; resource_id: string };
      message?: string;
    }>(`/resource-management/download/?resource_id=${resourceId}`);
    if (response.data?.code === 'BE0000' && response.data.data?.url) {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Không tạo được link tải xuống.');
  },

  /**
   * Share resource with another user by email (owner only).
   */
  async shareResource(
    resourceId: string,
    payload: { email: string; can_edit?: boolean }
  ): Promise<ResourceShareInfo> {
    try {
      const response = await apiCall.post<{
        code: string;
        data?: ResourceShareInfo;
        message?: string;
      }>(`/resource-management/resources/${resourceId}/shares`, {
        email: payload.email,
        can_edit: payload.can_edit ?? false,
      });
      if (response.data?.code === 'BE0000' && response.data.data) {
        return response.data.data;
      }
      throw new Error(response.data?.message || 'Chia sẻ tài nguyên thất bại');
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Chia sẻ tài nguyên thất bại. Vui lòng kiểm tra email người nhận.'));
    }
  },

  /**
   * List all shares for a resource (owner only).
   */
  async getResourceShares(resourceId: string): Promise<ResourceShareInfo[]> {
    const response = await apiCall.get<{
      code: string;
      data?: ResourceShareInfo[];
      message?: string;
    }>(`/resource-management/resources/${resourceId}/shares`);
    if (response.data?.code === 'BE0000' && response.data.data) {
      return response.data.data;
    }
    return [];
  },

  /**
   * Remove share for a specific user (owner only).
   */
  async removeResourceShare(resourceId: string, targetUserId: string): Promise<void> {
    await apiCall.delete(
      `/resource-management/resources/${resourceId}/shares/${targetUserId}`
    );
  },

  /**
   * Download a resource via authenticated presigned MinIO URL
   */
  async downloadResource(resourceId: string, filename?: string): Promise<void> {
    try {
      const data = await ResourceService.getDownloadUrl(resourceId);
      const link = document.createElement('a');
      link.href = data.url;
      link.download = filename || data.filename || `resource_${resourceId}.bin`;
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      throw new Error(getApiErrorMessage(error, 'Không thể tải xuống tài nguyên.'));
    }
  },

  /**
   * Upload a new resource (multipart/form-data)
   */
  async uploadResource(
    file: File,
    payload: { name: string; version: string; stage_id?: string; status_id?: string; platform_id?: string; product_type_id?: string; repo_id?: string; tag_id?: string }
  ): Promise<Resource> {
    const formData = new FormData();
    formData.append('file_upload', file);
    formData.append('name', payload.name);
    formData.append('version', payload.version);
    if (payload.stage_id) formData.append('stage_id', payload.stage_id);
    if (payload.status_id) formData.append('status_id', payload.status_id);
    if (payload.platform_id) formData.append('platform_id', payload.platform_id);
    if (payload.product_type_id) formData.append('product_type_id', payload.product_type_id);
    if (payload.repo_id) formData.append('repo_id', payload.repo_id);
    if (payload.tag_id) formData.append('tag_id', payload.tag_id);

    const response = await apiCall.post<{ code: string; data: Resource; message?: string }>(
      '/resource-management/',
      formData,
      {
        headers: {
          'Content-Type': undefined,
        },
        transformRequest: [(data) => data],
      }
    );

    if (response.data && response.data.code === 'BE0000') {
      return response.data.data;
    }
    throw new Error(response.data?.message || 'Upload failed');
  },
};

