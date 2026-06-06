import { apiCall } from '../configs/axios';

const PREFIX = '/resource-management';

export interface ResourceTagRow {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
  user_id?: string;
}

interface ApiEnvelope<T> {
  code: string;
  data?: T;
  message?: string;
}

function dictToRows(data: Record<string, ResourceTagRow> | null | undefined): ResourceTagRow[] {
  if (!data || typeof data !== 'object') return [];
  return Object.values(data).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    created_at: String(row.created_at ?? ''),
    updated_at: String(row.updated_at ?? ''),
    user_id: row.user_id ? String(row.user_id) : undefined,
  }));
}

export const ResourceTagCatalogService = {
  async list(): Promise<ResourceTagRow[]> {
    try {
      const res = await apiCall.get<ApiEnvelope<Record<string, ResourceTagRow>>>(`${PREFIX}/resource_tags`);
      if (res.data?.code === 'BE0000' && res.data.data) {
        return dictToRows(res.data.data);
      }
      return [];
    } catch (e) {
      console.error('resource_tags list', e);
      return [];
    }
  },

  async create(name: string): Promise<boolean> {
    const res = await apiCall.post<ApiEnvelope<unknown>>(`${PREFIX}/resource_tags`, { name: name.trim() });
    return res.data?.code === 'BE0000';
  },

  async update(id: string, name: string): Promise<boolean> {
    const res = await apiCall.put<ApiEnvelope<unknown>>(`${PREFIX}/resource_tags/${id}`, {
      name: name.trim(),
    });
    return res.data?.code === 'BE0000';
  },

  async delete(id: string): Promise<boolean> {
    const res = await apiCall.delete<ApiEnvelope<unknown>>(`${PREFIX}/resource_tags/${id}`);
    return res.data?.code === 'BE0000';
  },
};
