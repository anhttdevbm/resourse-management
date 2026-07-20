/**
 * Token storage — sessionStorage (not document.cookie) so tokens are:
 * - not readable as cookies / not auto-sent on every request
 * - cleared when the tab/session ends
 * User profile may still use cookies via cookieStorage for non-secret prefs.
 */

const TOKEN_KEYS = new Set(["accessToken", "refreshToken"]);

function canUseSessionStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.sessionStorage;
  } catch {
    return false;
  }
}

export const tokenStorage = {
  getItem(key: string): string | null {
    if (!canUseSessionStorage()) return null;
    return sessionStorage.getItem(key);
  },

  setItem(key: string, value: string): void {
    if (!canUseSessionStorage()) return;
    sessionStorage.setItem(key, value);
  },

  removeItem(key: string): void {
    if (!canUseSessionStorage()) return;
    sessionStorage.removeItem(key);
  },

  clearAuthTokens(): void {
    TOKEN_KEYS.forEach((key) => tokenStorage.removeItem(key));
  },
};

/**
 * Cookie utility for non-secret client preferences (e.g. user profile cache).
 * Do NOT store access/refresh tokens here — use tokenStorage.
 */

interface CookieOptions {
  expires?: number;
  path?: string;
  domain?: string;
  secure?: boolean;
  sameSite?: "strict" | "lax" | "none";
}

export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
  const {
    expires = 7,
    path = "/",
    domain,
    secure = window.location.protocol === "https:",
    sameSite = "lax",
  } = options;

  let cookieString = `${encodeURIComponent(name)}=${encodeURIComponent(value)}`;

  if (expires) {
    const date = new Date();
    date.setTime(date.getTime() + expires * 24 * 60 * 60 * 1000);
    cookieString += `; expires=${date.toUTCString()}`;
  }

  cookieString += `; path=${path}`;

  if (domain) {
    cookieString += `; domain=${domain}`;
  }

  if (secure) {
    cookieString += `; secure`;
  }

  cookieString += `; sameSite=${sameSite}`;

  document.cookie = cookieString;
};

export const getCookie = (name: string): string | null => {
  const nameEQ = encodeURIComponent(name) + "=";
  const cookies = document.cookie.split(";");

  for (let i = 0; i < cookies.length; i++) {
    let cookie = cookies[i];
    while (cookie.charAt(0) === " ") {
      cookie = cookie.substring(1, cookie.length);
    }
    if (cookie.indexOf(nameEQ) === 0) {
      return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
    }
  }

  return null;
};

export const removeCookie = (
  name: string,
  options: { path?: string; domain?: string } = {}
): void => {
  const { path = "/", domain } = options;
  let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
  if (domain) {
    cookieString += `; domain=${domain}`;
  }
  document.cookie = cookieString;
};

/**
 * Storage wrapper: tokens → sessionStorage; other keys → cookies.
 */
export const cookieStorage = {
  getItem(key: string): string | null {
    if (TOKEN_KEYS.has(key)) {
      return tokenStorage.getItem(key);
    }
    return getCookie(key);
  },

  setItem(key: string, value: string, _options?: CookieOptions): void {
    if (TOKEN_KEYS.has(key)) {
      tokenStorage.setItem(key, value);
      // Migrate away from legacy document.cookie tokens
      removeCookie(key);
      return;
    }
    setCookie(key, value, _options);
  },

  removeItem(key: string): void {
    if (TOKEN_KEYS.has(key)) {
      tokenStorage.removeItem(key);
      removeCookie(key);
      return;
    }
    removeCookie(key);
  },

  clear(): void {
    tokenStorage.clearAuthTokens();
    const cookies = document.cookie.split(";");
    cookies.forEach((cookie) => {
      const eqPos = cookie.indexOf("=");
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      if (name) {
        removeCookie(name);
      }
    });
  },
};
