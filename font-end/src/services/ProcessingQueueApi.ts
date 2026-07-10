import { apiCall } from '../configs/axios';

export type ProcessingQueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ProcessingQueueJob {
  id: string;
  resource_id: string;
  user_id: string;
  filename: string;
  resource_name: string;
  fill_keys: string[];
  status: ProcessingQueueStatus | string;
  error?: string | null;
  result?: {
    matched_rule_id?: string | null;
    matched_rule_title?: string | null;
    assigned?: Record<string, string>;
  } | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProcessingQueueStats {
  total: number;
  pending: number;
  processing: number;
  completed: number;
  failed: number;
}

type Envelope<T> = { code: string; data?: T; message?: string };

export const ProcessingQueueApi = {
  async list(limit = 50): Promise<{ items: ProcessingQueueJob[]; stats: ProcessingQueueStats }> {
    const res = await apiCall.get<Envelope<{ items: ProcessingQueueJob[]; stats: ProcessingQueueStats }>>(
      `/resource-management/processing_queue`,
      { params: { limit } }
    );
    if (res.data?.code === 'BE0000' && res.data.data) {
      return res.data.data;
    }
    throw new Error(res.data?.message || 'Không tải được processing queue');
  },
};
