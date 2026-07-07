import { apiCall } from '../configs/axios';

export interface StatisticsData {
  total_resources: number;
  uploads_today: number;
  total_downloads: number;
  total_uploads?: number;
  files_pending_review: number;
  total_users?: number;
  total_file_types?: number;
}

export interface RecentActivity {
  id: string;
  type: 'upload' | 'pending' | 'approved' | 'rejected';
  message: string;
  time_ago: string;
  color: 'blue' | 'green' | 'yellow' | 'red';
  file_name: string;
  file_ext: string;
  created_at: string | null;
}

export interface FileTypeStats {
  type: string;
  count: number;
  percentage: number;
  color: string;
}

export interface TopDownloadedResource {
  id: string;
  name: string;
  extension: string;
  downloads: number;
  url: string;
}

export interface StorageUsage {
  used_space_tb: number;
  available_space_tb: number;
  total_capacity_tb: number;
  usage_percentage: number;
  total_files: number;
}

export interface SecurityStats {
  files_scanned: number;
  clean_files: number;
  infected_files: number;
}

export interface StatisticsResponse {
  code: string;
  message: string;
  data: StatisticsData;
  links: any;
  relationships: any;
}

export interface RecentActivitiesResponse {
  code: string;
  message: string;
  data: RecentActivity[];
  links: any;
  relationships: any;
}

export interface FileTypeStatsResponse {
  code: string;
  message: string;
  data: FileTypeStats[];
  links: any;
  relationships: any;
}

export interface TopDownloadsResponse {
  code: string;
  message: string;
  data: TopDownloadedResource[];
  links: any;
  relationships: any;
}

export interface StorageUsageResponse {
  code: string;
  message: string;
  data: StorageUsage;
  links: any;
  relationships: any;
}

export interface SecurityStatsResponse {
  code: string;
  message: string;
  data: SecurityStats;
  links: any;
  relationships: any;
}

export interface DownloadStatistics {
  period: string;
  start_date: string;
  end_date: string;
  total_downloads: number;
  average_downloads: number;
  peak_downloads: number;
  time_series: Array<{
    date: string;
    downloads: number;
  }>;
}

export interface UploadStatistics {
  period: string;
  start_date: string;
  end_date: string;
  total_uploads: number;
  average_uploads: number;
  peak_uploads: number;
  time_series: Array<{
    date: string;
    uploads: number;
  }>;
}

export interface UserStatistics {
  period: string;
  start_date: string;
  end_date: string;
  total_users: number;
  new_users_today: number;
  locked_users: number;
  admin_users: number;
  active_downloaders: number;
  registrations: Array<{
    date: string;
    registrations: number;
  }>;
}

export interface BreakdownItem {
  name: string;
  count: number;
  percentage: number;
  color: string;
}

export type ReportPeriod = '1d' | '7d' | '30d' | '90d' | '1y';

export interface DownloadStatisticsResponse {
  code: string;
  message: string;
  data: DownloadStatistics;
  links: any;
  relationships: any;
}

export const StatisticsService = {
  async getStatistics(): Promise<StatisticsData> {
    try {
      console.log('🔄 Calling statistics API...');
      const response = await apiCall.get<StatisticsResponse>('/resource-management/statistics');
      console.log('📊 Statistics API response:', response.data);
      
      if (response.data.code === 'BE0000') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get statistics');
      }
    } catch (error) {
      console.error('❌ Statistics API Error:', error);
      throw error;
    }
  },

  async getRecentActivities(limit: number = 10): Promise<RecentActivity[]> {
    try {
      console.log('🔄 Calling recent activities API...');
      const response = await apiCall.get<RecentActivitiesResponse>(
        `/resource-management/statistics/recent-activities?limit=${limit}`
      );
      console.log('📊 Recent activities API response:', response.data);
      
      if (response.data.code === 'BE0000') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get recent activities');
      }
    } catch (error) {
      console.error('❌ Recent Activities API Error:', error);
      throw error;
    }
  },

  async getFileTypeStatistics(): Promise<FileTypeStats[]> {
    try {
      console.log('🔄 Calling file type statistics API...');
      const response = await apiCall.get<FileTypeStatsResponse>(
        '/resource-management/statistics/file-types'
      );
      console.log('📊 File type statistics API response:', response.data);
      
      if (response.data.code === 'BE0000') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get file type statistics');
      }
    } catch (error) {
      console.error('❌ File Type Statistics API Error:', error);
      throw error;
    }
  },

  async getTopDownloadedResources(limit: number = 10): Promise<TopDownloadedResource[]> {
    try {
      console.log('🔄 Calling top downloads API...');
      const response = await apiCall.get<TopDownloadsResponse>(
        `/resource-management/statistics/top-downloads?limit=${limit}`
      );
      console.log('📊 Top downloads API response:', response.data);
      
      if (response.data.code === 'BE0000') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get top downloads');
      }
    } catch (error) {
      console.error('❌ Top Downloads API Error:', error);
      throw error;
    }
  },

  async getStorageUsage(): Promise<StorageUsage> {
    try {
      console.log('🔄 Calling storage usage API...');
      const response = await apiCall.get<StorageUsageResponse>(
        '/resource-management/statistics/storage-usage'
      );
      console.log('📊 Storage usage API response:', response.data);
      
      if (response.data.code === 'BE0000') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get storage usage');
      }
    } catch (error) {
      console.error('❌ Storage Usage API Error:', error);
      throw error;
    }
  },

  async getSecurityStatistics(): Promise<SecurityStats> {
    try {
      console.log('🔄 Calling security statistics API...');
      const response = await apiCall.get<SecurityStatsResponse>(
        '/resource-management/statistics/security'
      );
      console.log('📊 Security statistics API response:', response.data);
      
      if (response.data.code === 'BE0000') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get security statistics');
      }
    } catch (error) {
      console.error('❌ Security Statistics API Error:', error);
      throw error;
    }
  },

  async getDownloadStatistics(period: ReportPeriod = '7d'): Promise<DownloadStatistics> {
    try {
      console.log(`🔄 Calling download statistics API (period: ${period})...`);
      const response = await apiCall.get<DownloadStatisticsResponse>(
        `/resource-management/statistics/downloads?period=${period}`
      );
      console.log('📊 Download statistics API response:', response.data);
      
      if (response.data.code === 'BE0000') {
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to get download statistics');
      }
    } catch (error) {
      console.error('❌ Download Statistics API Error:', error);
      throw error;
    }
  },

  async getUploadStatistics(period: ReportPeriod = '7d'): Promise<UploadStatistics> {
    const response = await apiCall.get<{ code: string; data: UploadStatistics; message?: string }>(
      `/resource-management/statistics/uploads?period=${period}`
    );
    if (response.data.code === 'BE0000') return response.data.data;
    throw new Error(response.data.message || 'Failed to get upload statistics');
  },

  async getUserStatistics(period: ReportPeriod = '30d'): Promise<UserStatistics> {
    const response = await apiCall.get<{ code: string; data: UserStatistics; message?: string }>(
      `/resource-management/statistics/users?period=${period}`
    );
    if (response.data.code === 'BE0000') return response.data.data;
    throw new Error(response.data.message || 'Failed to get user statistics');
  },

  async getResourceStatusBreakdown(): Promise<BreakdownItem[]> {
    const response = await apiCall.get<{ code: string; data: BreakdownItem[]; message?: string }>(
      '/resource-management/statistics/resource-status'
    );
    if (response.data.code === 'BE0000') return response.data.data;
    throw new Error(response.data.message || 'Failed to get resource status breakdown');
  },

  async getPlatformBreakdown(): Promise<BreakdownItem[]> {
    const response = await apiCall.get<{ code: string; data: BreakdownItem[]; message?: string }>(
      '/resource-management/statistics/platforms'
    );
    if (response.data.code === 'BE0000') return response.data.data;
    throw new Error(response.data.message || 'Failed to get platform breakdown');
  },

  async getProductTypeBreakdown(): Promise<BreakdownItem[]> {
    const response = await apiCall.get<{ code: string; data: BreakdownItem[]; message?: string }>(
      '/resource-management/statistics/product-types'
    );
    if (response.data.code === 'BE0000') return response.data.data;
    throw new Error(response.data.message || 'Failed to get product type breakdown');
  },

  async getStageBreakdown(): Promise<BreakdownItem[]> {
    const response = await apiCall.get<{ code: string; data: BreakdownItem[]; message?: string }>(
      '/resource-management/statistics/stages'
    );
    if (response.data.code === 'BE0000') return response.data.data;
    throw new Error(response.data.message || 'Failed to get stage breakdown');
  },
};
