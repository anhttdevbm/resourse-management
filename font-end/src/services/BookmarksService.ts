/**
 * Bookmarks — lưu tài nguyên đánh dấu qua API (thay localStorage).
 */
import axiosInstance from '../configs/axios';

const LEGACY_STORAGE_KEY = 'resource_bookmarks';

export interface BookmarkResourceRecord {
  id: string;
  name: string;
  version: string;
  url?: string;
  note?: string;
  bookmarked_at: string;
}

let cache: BookmarkResourceRecord[] = [];

function sortBookmarks(items: BookmarkResourceRecord[]): BookmarkResourceRecord[] {
  return [...items].sort(
    (a, b) => new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime()
  );
}

function readLegacy(): BookmarkResourceRecord[] {
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
      await axiosInstance.post('/resource-management/users/me/bookmarks', {
        resource_id: item.id,
        name: item.name,
        version: item.version,
        url: item.url,
        note: item.note,
      });
    } catch {
      // skip
    }
  }
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export async function loadBookmarks(): Promise<BookmarkResourceRecord[]> {
  try {
    const response = await axiosInstance.get('/resource-management/users/me/bookmarks');
    const items = (response.data?.data?.items as BookmarkResourceRecord[]) ?? [];
    if (!items.length && readLegacy().length) {
      await migrateLegacyFromLocalStorage();
      const retry = await axiosInstance.get('/resource-management/users/me/bookmarks');
      cache = sortBookmarks((retry.data?.data?.items as BookmarkResourceRecord[]) ?? []);
    } else {
      cache = sortBookmarks(items);
    }
    return cache;
  } catch {
    cache = sortBookmarks(readLegacy());
    return cache;
  }
}

export function isBookmarked(id: string): boolean {
  return cache.some((r) => r.id === id);
}

export async function addBookmark(record: Omit<BookmarkResourceRecord, 'bookmarked_at'>) {
  if (cache.some((r) => r.id === record.id)) return;
  try {
    const response = await axiosInstance.post('/resource-management/users/me/bookmarks', {
      resource_id: record.id,
      name: record.name,
      version: record.version,
      url: record.url,
      note: record.note,
    });
    const item = response.data?.data as BookmarkResourceRecord;
    if (item) {
      cache = sortBookmarks([item, ...cache.filter((r) => r.id !== item.id)]);
      return;
    }
  } catch {
    // fallback
  }
  cache = sortBookmarks([{ ...record, bookmarked_at: new Date().toISOString() }, ...cache]);
}

export async function removeBookmark(id: string) {
  try {
    await axiosInstance.delete(`/resource-management/users/me/bookmarks/${id}`);
  } catch {
    // ignore
  }
  cache = cache.filter((r) => r.id !== id);
}

export async function toggleBookmark(
  record: Omit<BookmarkResourceRecord, 'bookmarked_at' | 'note'> & { note?: string }
): Promise<boolean> {
  if (isBookmarked(record.id)) {
    await removeBookmark(record.id);
    return false;
  }
  await addBookmark(record);
  return true;
}

export async function updateNote(id: string, note: string) {
  const trimmed = note.trim();
  try {
    const response = await axiosInstance.patch(`/resource-management/users/me/bookmarks/${id}`, {
      note: trimmed || null,
    });
    const item = response.data?.data as BookmarkResourceRecord;
    if (item) {
      cache = sortBookmarks(cache.map((r) => (r.id === id ? item : r)));
      return;
    }
  } catch {
    // fallback
  }
  cache = sortBookmarks(
    cache.map((r) => (r.id === id ? { ...r, note: trimmed || undefined } : r))
  );
}

export function getBookmarks(): BookmarkResourceRecord[] {
  return sortBookmarks(cache);
}

export async function clearBookmarks() {
  try {
    await axiosInstance.delete('/resource-management/users/me/bookmarks');
  } catch {
    // ignore
  }
  cache = [];
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export const BOOKMARKS_STORAGE_KEY = LEGACY_STORAGE_KEY;

export const BookmarksService = {
  loadBookmarks,
  isBookmarked,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  updateNote,
  getBookmarks,
  clearBookmarks,
};
