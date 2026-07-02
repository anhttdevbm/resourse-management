/**
 * Download history — đọc từ download_logs qua API (backend ghi khi tải).
 */
import axiosInstance from '../configs/axios';

const LEGACY_STORAGE_KEY = 'resource_download_history';

export interface DownloadedResourceRecord {
  id: string;
  name: string;
  version: string;
  url?: string;
  downloaded_at: string;
  extension?: string;
}

let cache: DownloadedResourceRecord[] = [];

function sortHistory(items: DownloadedResourceRecord[]): DownloadedResourceRecord[] {
  return [...items].sort(
    (a, b) => new Date(b.downloaded_at).getTime() - new Date(a.downloaded_at).getTime()
  );
}

export async function loadHistory(): Promise<DownloadedResourceRecord[]> {
  try {
    const response = await axiosInstance.get('/resource-management/users/me/download-history');
    cache = sortHistory((response.data?.data?.items as DownloadedResourceRecord[]) ?? []);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return cache;
  } catch {
    try {
      const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        cache = sortHistory(Array.isArray(parsed) ? parsed : []);
        return cache;
      }
    } catch {
      // ignore
    }
    cache = [];
    return cache;
  }
}

/** Không cần ghi client-side — backend ghi download_log khi tải. */
export async function addToHistory(_record: Omit<DownloadedResourceRecord, 'downloaded_at'>) {
  await loadHistory();
}

export function getHistory(): DownloadedResourceRecord[] {
  return sortHistory(cache);
}

export async function removeFromHistory(id: string) {
  cache = cache.filter((r) => r.id !== id);
}

export async function clearHistory() {
  cache = [];
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export const DownloadHistoryService = {
  loadHistory,
  addToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
};
