/**
 * Bookmarks — lưu tài nguyên đánh dấu (localStorage), kèm ghi chú tùy chọn.
 */

const STORAGE_KEY = 'resource_bookmarks';

export interface BookmarkResourceRecord {
  id: string;
  name: string;
  version: string;
  url?: string;
  note?: string;
  bookmarked_at: string;
}

function getStorage(): BookmarkResourceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStorage(items: BookmarkResourceRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('BookmarksService: setStorage failed', e);
  }
}

export function isBookmarked(id: string): boolean {
  return getStorage().some((r) => r.id === id);
}

export function addBookmark(record: Omit<BookmarkResourceRecord, 'bookmarked_at'>) {
  const list = getStorage();
  if (list.some((r) => r.id === record.id)) return;
  setStorage([
    { ...record, bookmarked_at: new Date().toISOString() },
    ...list,
  ]);
}

export function removeBookmark(id: string) {
  setStorage(getStorage().filter((r) => r.id !== id));
}

export function toggleBookmark(
  record: Omit<BookmarkResourceRecord, 'bookmarked_at' | 'note'> & { note?: string }
): boolean {
  if (isBookmarked(record.id)) {
    removeBookmark(record.id);
    return false;
  }
  addBookmark(record);
  return true;
}

export function updateNote(id: string, note: string) {
  const trimmed = note.trim();
  setStorage(
    getStorage().map((r) =>
      r.id === id ? { ...r, note: trimmed || undefined } : r
    )
  );
}

export function getBookmarks(): BookmarkResourceRecord[] {
  return getStorage().sort(
    (a, b) =>
      new Date(b.bookmarked_at).getTime() - new Date(a.bookmarked_at).getTime()
  );
}

export function clearBookmarks() {
  setStorage([]);
}

export const BOOKMARKS_STORAGE_KEY = STORAGE_KEY;

export const BookmarksService = {
  isBookmarked,
  addBookmark,
  removeBookmark,
  toggleBookmark,
  updateNote,
  getBookmarks,
  clearBookmarks,
};
