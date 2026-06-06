/** Áp dụng theme theo cài đặt user (Tailwind `darkMode: ['class']` → class `dark` trên <html>). */

export type ThemeChoice = 'light' | 'dark' | 'system';

const MEDIA = '(prefers-color-scheme: dark)';

let mediaQuery: MediaQueryList | null = null;
let onMediaChange: (() => void) | null = null;

function detachSystemListener(): void {
  if (typeof window === 'undefined' || !mediaQuery || !onMediaChange) return;
  mediaQuery.removeEventListener('change', onMediaChange);
  mediaQuery = null;
  onMediaChange = null;
}

/**
 * Cập nhật class `dark` trên documentElement.
 * - `light`: tắt dark
 * - `dark`: bật dark
 * - `system`: theo OS, lắng nghe thay đổi prefers-color-scheme
 */
export function applyTheme(theme: ThemeChoice): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  detachSystemListener();
  root.classList.remove('dark');

  if (theme === 'dark') {
    root.classList.add('dark');
    return;
  }

  if (theme === 'system') {
    const sync = () => {
      const dark = typeof window !== 'undefined' && window.matchMedia(MEDIA).matches;
      root.classList.toggle('dark', dark);
    };
    sync();
    if (typeof window !== 'undefined') {
      mediaQuery = window.matchMedia(MEDIA);
      onMediaChange = () => sync();
      mediaQuery.addEventListener('change', onMediaChange);
    }
  }
}
