/**
 * Upload history - lưu lịch sử tài nguyên đã upload (localStorage).
 * Khi user upload tài nguyên thành công, ghi vào đây để hiển thị tại "Lịch sử upload".
 */

const STORAGE_KEY = 'resource_upload_history';

export interface UploadedResourceRecord {
  id: string;
  name: string;
  version: string;
  url?: string;
  uploaded_at: string; // ISO string
}

function getStorage(): UploadedResourceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStorage(items: UploadedResourceRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('UploadHistoryService: setStorage failed', e);
  }
}

/** Thêm một bản ghi đã upload (gọi khi upload thành công). */
export function addToHistory(record: Omit<UploadedResourceRecord, 'uploaded_at'>) {
  const list = getStorage();
  const existing = list.find((r) => r.id === record.id);
  const newRecord: UploadedResourceRecord = {
    ...record,
    uploaded_at: new Date().toISOString(),
  };
  if (existing) {
    const rest = list.filter((r) => r.id !== record.id);
    setStorage([newRecord, ...rest]);
  } else {
    setStorage([newRecord, ...list]);
  }
}

/** Lấy toàn bộ lịch sử upload (mới nhất trước). */
export function getHistory(): UploadedResourceRecord[] {
  const list = getStorage();
  return list.sort(
    (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
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

export const UploadHistoryService = {
  addToHistory,
  getHistory,
  removeFromHistory,
  clearHistory,
};

