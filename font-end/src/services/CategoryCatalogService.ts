import { apiCall } from '../configs/axios';

const PREFIX = '/resource-management';

export interface CatalogRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

interface ApiEnvelope<T> {
  code: string;
  data?: T;
  message?: string;
}

function dictToRows(data: Record<string, CatalogRow> | null | undefined): CatalogRow[] {
  if (!data || typeof data !== 'object') return [];
  return Object.values(data).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
  }));
}

async function getDict(path: string): Promise<CatalogRow[]> {
  try {
    const res = await apiCall.get<ApiEnvelope<Record<string, CatalogRow>>>(path);
    if (res.data?.code === 'BE0000' && res.data.data) {
      return dictToRows(res.data.data);
    }
    return [];
  } catch (e) {
    console.error(path, e);
    return [];
  }
}

export const CategoryCatalogService = {
  listStages: () => getDict(`${PREFIX}/resource_stages`),
  listProductTypes: () => getDict(`${PREFIX}/produce_types`),
  listPlatforms: () => getDict(`${PREFIX}/resource_platforms`),

  async createStage(name: string): Promise<boolean> {
    const res = await apiCall.post<ApiEnvelope<unknown>>(`${PREFIX}/resource_stages`, { name: name.trim() });
    return res.data?.code === 'BE0000';
  },

  async updateStage(id: string, name: string): Promise<boolean> {
    const res = await apiCall.put<ApiEnvelope<unknown>>(`${PREFIX}/resource_stages/${id}`, {
      name: name.trim(),
    });
    return res.data?.code === 'BE0000';
  },

  async deleteStage(id: string): Promise<boolean> {
    const res = await apiCall.delete<ApiEnvelope<unknown>>(`${PREFIX}/resource_stages/`, {
      params: { resource_stage_id: id },
    });
    return res.data?.code === 'BE0000';
  },

  async createProductType(name: string): Promise<boolean> {
    const res = await apiCall.post<ApiEnvelope<unknown>>(`${PREFIX}/produce_types`, { name: name.trim() });
    return res.data?.code === 'BE0000';
  },

  async updateProductType(id: string, name: string): Promise<boolean> {
    const res = await apiCall.put<ApiEnvelope<unknown>>(`${PREFIX}/produce_types/${id}`, {
      name: name.trim(),
    });
    return res.data?.code === 'BE0000';
  },

  async deleteProductType(id: string): Promise<boolean> {
    const res = await apiCall.delete<ApiEnvelope<unknown>>(`${PREFIX}/produce_types/`, {
      params: { produce_type_id: id },
    });
    return res.data?.code === 'BE0000';
  },

  async createPlatform(name: string): Promise<boolean> {
    const res = await apiCall.post<ApiEnvelope<unknown>>(`${PREFIX}/resource_platforms`, {
      name: name.trim(),
    });
    return res.data?.code === 'BE0000';
  },

  async updatePlatform(id: string, name: string): Promise<boolean> {
    const res = await apiCall.put<ApiEnvelope<unknown>>(`${PREFIX}/resource_platforms/${id}`, {
      name: name.trim(),
    });
    return res.data?.code === 'BE0000';
  },

  async deletePlatform(id: string): Promise<boolean> {
    const res = await apiCall.delete<ApiEnvelope<unknown>>(`${PREFIX}/resource_platforms/`, {
      params: { resource_platform_id: id },
    });
    return res.data?.code === 'BE0000';
  },
};
