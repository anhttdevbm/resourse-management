/**
 * Upload history — đọc từ resources của user qua API.
 */
import axiosInstance from '../configs/axios';

const LEGACY_STORAGE_KEY = 'resource_upload_history';

export interface UploadedResourceRecord {
  id: string;
  name: string;
  version: string;
  url?: string;
  uploaded_at: string;
}

let cache: UploadedResourceRecord[] = [];

function sortHistory(items: UploadedResourceRecord[]): UploadedResourceRecord[] {
  return [...items].sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
  );
}

export async function loadHistory(): Promise<UploadedResourceRecord[]> {
  try {
    const response = await axiosInstance.get('/resource-management/users/me/upload-history');
    cache = sortHistory((response.data?.data?.items as UploadedResourceRecord[]) ?? []);
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

/** Upload thành công — refresh từ API thay vì localStorage. */
export async function addToHistory(_record: Omit<UploadedResourceRecord, 'uploaded_at'>) {
  await loadHistory();
}

export function getHistory(): UploadedResourceRecord[] {
  return sortHistory(cache);
}

export async function removeFromHistory(id: string) {
  cache = cache.filter((r) => r.id !== id);
}

export async function clearHistory() {
  cache = [];
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export const UploadHistoryService = {
  loadHistory,
  addToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
};
