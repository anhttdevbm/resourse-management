/**
 * Favorites — lưu tài nguyên yêu thích qua API (thay localStorage).
 */
import axiosInstance from '../configs/axios';

const LEGACY_STORAGE_KEY = 'resource_favorites';

export interface FavoriteResourceRecord {
  id: string;
  name: string;
  version: string;
  url?: string;
  added_at: string;
}

let cache: FavoriteResourceRecord[] = [];

function sortFavorites(items: FavoriteResourceRecord[]): FavoriteResourceRecord[] {
  return [...items].sort(
    (a, b) => new Date(b.added_at).getTime() - new Date(a.added_at).getTime()
  );
}

function readLegacy(): FavoriteResourceRecord[] {
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
      await axiosInstance.post('/resource-management/users/me/favorites', {
        resource_id: item.id,
        name: item.name,
        version: item.version,
        url: item.url,
      });
    } catch {
      // skip failed items
    }
  }
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export async function loadFavorites(): Promise<FavoriteResourceRecord[]> {
  try {
    const response = await axiosInstance.get('/resource-management/users/me/favorites');
    const items = (response.data?.data?.items as FavoriteResourceRecord[]) ?? [];
    if (!items.length && readLegacy().length) {
      await migrateLegacyFromLocalStorage();
      const retry = await axiosInstance.get('/resource-management/users/me/favorites');
      cache = sortFavorites((retry.data?.data?.items as FavoriteResourceRecord[]) ?? []);
    } else {
      cache = sortFavorites(items);
    }
    return cache;
  } catch {
    cache = sortFavorites(readLegacy());
    return cache;
  }
}

export function isFavorite(id: string): boolean {
  return cache.some((r) => r.id === id);
}

export async function addToFavorites(record: Omit<FavoriteResourceRecord, 'added_at'>) {
  if (cache.some((r) => r.id === record.id)) return;
  try {
    const response = await axiosInstance.post('/resource-management/users/me/favorites', {
      resource_id: record.id,
      name: record.name,
      version: record.version,
      url: record.url,
    });
    const item = response.data?.data as FavoriteResourceRecord;
    if (item) {
      cache = sortFavorites([item, ...cache.filter((r) => r.id !== item.id)]);
      return;
    }
  } catch {
    // fallback below
  }
  cache = sortFavorites([{ ...record, added_at: new Date().toISOString() }, ...cache]);
}

export async function removeFromFavorites(id: string) {
  try {
    await axiosInstance.delete(`/resource-management/users/me/favorites/${id}`);
  } catch {
    // keep local cache update
  }
  cache = cache.filter((r) => r.id !== id);
}

export async function toggleFavorite(record: Omit<FavoriteResourceRecord, 'added_at'>): Promise<boolean> {
  if (isFavorite(record.id)) {
    await removeFromFavorites(record.id);
    return false;
  }
  await addToFavorites(record);
  return true;
}

export function getFavorites(): FavoriteResourceRecord[] {
  return sortFavorites(cache);
}

export async function clearFavorites() {
  try {
    await axiosInstance.delete('/resource-management/users/me/favorites');
  } catch {
    // ignore
  }
  cache = [];
  localStorage.removeItem(LEGACY_STORAGE_KEY);
}

export const FAVORITES_STORAGE_KEY = LEGACY_STORAGE_KEY;

export const FavoritesService = {
  loadFavorites,
  isFavorite,
  addToFavorites,
  removeFromFavorites,
  toggleFavorite,
  getFavorites,
  clearFavorites,
};
