/**
 * Favorites - lưu tài nguyên yêu thích (localStorage).
 */

const STORAGE_KEY = 'resource_favorites';

export interface FavoriteResourceRecord {
  id: string;
  name: string;
  version: string;
  url?: string;
  added_at: string;
}

function getStorage(): FavoriteResourceRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setStorage(items: FavoriteResourceRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('FavoritesService: setStorage failed', e);
  }
}

export function isFavorite(id: string): boolean {
  return getStorage().some((r) => r.id === id);
}

export function addToFavorites(record: Omit<FavoriteResourceRecord, 'added_at'>) {
  const list = getStorage();
  if (list.some((r) => r.id === record.id)) return;
  setStorage([
    { ...record, added_at: new Date().toISOString() },
    ...list,
  ]);
}

export function removeFromFavorites(id: string) {
  setStorage(getStorage().filter((r) => r.id !== id));
}

export function toggleFavorite(record: Omit<FavoriteResourceRecord, 'added_at'>): boolean {
  if (isFavorite(record.id)) {
    removeFromFavorites(record.id);
    return false;
  }
  addToFavorites(record);
  return true;
}

export function getFavorites(): FavoriteResourceRecord[] {
  const list = getStorage();
  return list.sort(
    (a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
  );
}

export function clearFavorites() {
  setStorage([]);
}

export const FavoritesService = {
  isFavorite,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  getFavorites,
  clearFavorites,
};
