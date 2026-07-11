import { apiCall } from '../configs/axios';
import type { ResourceFilters } from './ResourceService';

export interface SearchResource {
  id: string;
  name: string;
  version?: string;
  url?: string;
  created_at?: string;
  resource_platform?: { id?: string; name?: string } | null;
  resource_status?: { id?: string; name?: string } | null;
  resource_stage?: { id?: string; name?: string } | null;
}

export interface SearchUser {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface SearchResults {
  resources: SearchResource[];
  users: SearchUser[];
}

export type AdvancedSearchFilters = Omit<ResourceFilters, 'id' | 'name' | 'q'>;

export const SearchService = {
  async searchResources(
    query: string,
    filters?: AdvancedSearchFilters
  ): Promise<SearchResource[]> {
    try {
      const params: Record<string, string> = {};
      const q = query.trim();
      if (q) params.q = q;
      if (filters?.version) params.version = filters.version;
      if (filters?.stage_id) params.stage_id = filters.stage_id;
      if (filters?.status_id) params.status_id = filters.status_id;
      if (filters?.platform_id) params.platform_id = filters.platform_id;
      if (filters?.product_type_id) params.product_type_id = filters.product_type_id;
      if (filters?.repo_id) params.repo_id = filters.repo_id;
      if (filters?.tag_id) params.tag_id = filters.tag_id;

      const response = await apiCall.get('/resource-management/resources/', { params });
      if (response.data && response.data.code === 'BE0000') {
        return response.data.data || [];
      }
      return [];
    } catch (error) {
      console.error('Error searching resources:', error);
      return [];
    }
  },

  async searchUsers(query: string): Promise<SearchUser[]> {
    try {
      const response = await apiCall.get('/resource-management/users', {
        params: {
          page: 1,
          page_size: 50,
        },
      });

      if (response.data && response.data.code === 'BE0000') {
        const users = response.data.data?.users || response.data.data || [];
        const q = query.toLowerCase();
        const filteredUsers = users.filter(
          (user: SearchUser) =>
            user.name?.toLowerCase().includes(q) || user.email?.toLowerCase().includes(q)
        );
        return filteredUsers.slice(0, 10);
      }
      return [];
    } catch (error) {
      console.error('Error searching users:', error);
      return [];
    }
  },

  async searchAll(
    query: string,
    filters?: AdvancedSearchFilters
  ): Promise<SearchResults> {
    const hasText = Boolean(query && query.trim().length >= 2);
    const hasFilters = Boolean(
      filters &&
        Object.values(filters).some((v) => typeof v === 'string' && v.trim().length > 0)
    );
    if (!hasText && !hasFilters) {
      return { resources: [], users: [] };
    }

    try {
      const [resources, users] = await Promise.all([
        this.searchResources(hasText ? query.trim() : '', filters),
        hasText ? this.searchUsers(query.trim()) : Promise.resolve([]),
      ]);
      return { resources, users };
    } catch (error) {
      console.error('Error in searchAll:', error);
      return { resources: [], users: [] };
    }
  },
};
