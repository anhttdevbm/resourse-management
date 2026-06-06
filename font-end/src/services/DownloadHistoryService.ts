/**
 * Download history - lưu lịch sử tài nguyên đã tải (localStorage).
 * Khi user bấm "Tải xuống" ở trang Resources, ghi vào đây để hiển thị tại "Tài nguyên đã tải".
 */

const STORAGE_KEY = 'resource_download_history';

export interface DownloadedResourceRecord {
  id: string;
  name: string;
  version: string;
  url?: string;
  downloaded_at: string; // ISO string
  extension?: string;
}

function getStorage(): DownloadedResourceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStorage(items: DownloadedResourceRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('DownloadHistoryService: setStorage failed', e);
  }
}

/** Thêm một bản ghi đã tải (gọi khi user bấm Tải xuống). */
export function addToHistory(record: Omit<DownloadedResourceRecord, 'downloaded_at'>) {
  const list = getStorage();
  const existing = list.find((r) => r.id === record.id);
  const newRecord: DownloadedResourceRecord = {
    ...record,
    downloaded_at: new Date().toISOString(),
  };
  if (existing) {
    const rest = list.filter((r) => r.id !== record.id);
    setStorage([newRecord, ...rest]);
  } else {
    setStorage([newRecord, ...list]);
  }
}

/** Lấy toàn bộ lịch sử đã tải (mới nhất trước). */
export function getHistory(): DownloadedResourceRecord[] {
  const list = getStorage();
  return list.sort(
    (a, b) => new Date(b.downloaded_at).getTime() - new Date(a.downloaded_at).getTime()
  );
}

/** Xóa một bản ghi theo id. */
export function removeFromHistory(id: string) {
  setStorage(getStorage().filter((r) => r.id !== id));
}

/** Xóa toàn bộ lịch sử. */
export function clearHistory() {
  setStorage([]);
}

export const DownloadHistoryService = {
  addToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
};
