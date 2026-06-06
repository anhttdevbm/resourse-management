/**
 * Lịch sử tìm kiếm — lưu localStorage (giống UploadHistory).
 * Ghi khi người dùng tìm từ trang Tìm kiếm hoặc modal.
 */

const STORAGE_KEY = 'resource_search_history';
const MAX_ITEMS = 200;

export interface SearchHistoryRecord {
  /** Khóa chuẩn hóa (trùng từ khóa → cập nhật bản ghi mới nhất) */
  id: string;
  /** Từ khóa hiển thị (lần gần nhất) */
  query: string;
  resource_count: number;
  user_count: number;
  searched_at: string;
}

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, ' ');
}

function getStorage(): SearchHistoryRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStorage(items: SearchHistoryRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items.slice(0, MAX_ITEMS)));
  } catch (e) {
    console.warn('SearchHistoryService: setStorage failed', e);
  }
}

/** Thêm / cập nhật một lần tìm (cùng từ khóa → đưa lên đầu, cập nhật số liệu). */
export function addToHistory(entry: {
  query: string;
  resource_count: number;
  user_count: number;
}) {
  const q = entry.query.trim();
  if (q.length < 2) return;

  const id = normalizeQuery(q);
  const list = getStorage().filter((r) => r.id !== id);
  const newRecord: SearchHistoryRecord = {
    id,
    query: q,
    resource_count: entry.resource_count,
    user_count: entry.user_count,
    searched_at: new Date().toISOString(),
  };
  setStorage([newRecord, ...list]);
}

export function getHistory(): SearchHistoryRecord[] {
  const list = getStorage();
  return list.sort(
    (a, b) => new Date(b.searched_at).getTime() - new Date(a.searched_at).getTime()
  );
}

export function removeFromHistory(id: string) {
  setStorage(getStorage().filter((r) => r.id !== id));
}

export function clearHistory() {
  setStorage([]);
}

export const SearchHistoryService = {
  addToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
};
