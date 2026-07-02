/**
 * Lịch sử tìm kiếm — lưu qua API (thay localStorage).
 */
import axiosInstance from '../configs/axios';

const LEGACY_STORAGE_KEY = 'resource_search_history';

export interface SearchHistoryRecord {
  id: string;
  query: string;
  resource_count: number;
  user_count: number;
  searched_at: string;
}

let cache: SearchHistoryRecord[] = [];

function sortHistory(items: SearchHistoryRecord[]): SearchHistoryRecord[] {
  return [...items].sort(
    (a, b) => new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime()
  );
}

function readLegacy(): SearchHistoryRecord[] {
  try {
    const raw = localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function migrateLegacyFromLocalStorage(): Promise<void> {
  const legacy = readLegacy();
  if (!legacy.length) return;
  for (const item of legacy) {
    try {
      await axiosInstance.post('/resource-management/users/me/search-history', {
        query: item.query,
        resource_count: item.resource_count,
        user_count: item.user_count,
      });
    } catch {
      // skip
    }
  }
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export async function loadHistory(): Promise<SearchHistoryRecord[]> {
  try {
    const response = await axiosInstance.get('/resource-management/users/me/search-history');
    const items = (response.data?.data?.items as SearchHistoryRecord[]) ?? [];
    if (!items.length && readLegacy().length) {
      await migrateLegacyFromLocalStorage();
      const retry = await axiosInstance.get('/resource-management/users/me/search-history');
      cache = sortHistory((retry.data?.data?.items as SearchHistoryRecord[]) ?? []);
    } else {
      cache = sortHistory(items);
    }
    return cache;
  } catch {
    cache = sortHistory(readLegacy());
    return cache;
  }
}

export async function addToHistory(entry: {
  query: string;
  resource_count: number;
  user_count: number;
}) {
  const q = entry.query.trim();
  if (q.length < 2) return;
  try {
    const response = await axiosInstance.post('/resource-management/users/me/search-history', {
      query: q,
      resource_count: entry.resource_count,
      user_count: entry.user_count,
    });
    const item = response.data?.data as SearchHistoryRecord;
    if (item?.id) {
      cache = sortHistory([item, ...cache.filter((r) => r.id !== item.id)]);
      return;
    }
  } catch {
    // fallback
  }
  const id = q.toLowerCase().replace(/\s+/g, ' ');
  cache = sortHistory([
    {
      id,
      query: q,
      resource_count: entry.resource_count,
      user_count: entry.user_count,
      searched_at: new Date().toISOString(),
    },
    ...cache.filter((r) => r.id !== id),
  ]);
}

export function getHistory(): SearchHistoryRecord[] {
  return sortHistory(cache);
}

export async function removeFromHistory(id: string) {
  try {
    await axiosInstance.delete(`/resource-management/users/me/search-history/${encodeURIComponent(id)}`);
  } catch {
    // ignore
  }
  cache = cache.filter((r) => r.id !== id);
}

export async function clearHistory() {
  try {
    await axiosInstance.delete('/resource-management/users/me/search-history');
  } catch {
    // ignore
  }
  cache = [];
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export const SearchHistoryService = {
  loadHistory,
  addToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
};
