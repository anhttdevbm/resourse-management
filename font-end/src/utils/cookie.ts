/**
 * Cookie utility functions
 * Note: httpOnly cookies cannot be set from JavaScript, only from server
 * We'll use secure and sameSite attributes for security
 */

interface CookieOptions {
    expires?: number; // Days until expiration
    path?: string;
    domain?: string;
    secure?: boolean; // Only send over HTTPS
    sameSite?: 'strict' | 'lax' | 'none';
}

/**
 * Set a cookie
 */
export const setCookie = (name: string, value: string, options: CookieOptions = {}): void => {
    const {
        expires = 7, // Default 7 days
        path = '/',
        domain,
        secure = window.location.protocol === 'https:', // Auto-detect HTTPS
        sameSite = 'lax'
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

/**
 * Get a cookie value
 */
export const getCookie = (name: string): string | null => {
    const nameEQ = encodeURIComponent(name) + '=';
    const cookies = document.cookie.split(';');

    for (let i = 0; i < cookies.length; i++) {
        let cookie = cookies[i];
        while (cookie.charAt(0) === ' ') {
            cookie = cookie.substring(1, cookie.length);
        }
        if (cookie.indexOf(nameEQ) === 0) {
            return decodeURIComponent(cookie.substring(nameEQ.length, cookie.length));
        }
    }

    return null;
};

/**
 * Remove a cookie
 */
export const removeCookie = (name: string, options: { path?: string; domain?: string } = {}): void => {
    const { path = '/', domain } = options;
    
    // Set expiration date in the past
    let cookieString = `${encodeURIComponent(name)}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=${path}`;
    
    if (domain) {
        cookieString += `; domain=${domain}`;
    }

    document.cookie = cookieString;
};

/**
 * Check if cookies are enabled
 */
export const areCookiesEnabled = (): boolean => {
    try {
        setCookie('__test_cookie__', 'test');
        const enabled = getCookie('__test_cookie__') === 'test';
        removeCookie('__test_cookie__');
        return enabled;
    } catch (e) {
        return false;
    }
};

/**
 * Storage wrapper for cookies (to replace localStorage API)
 */
export const cookieStorage = {
    getItem: (key: string): string | null => {
        return getCookie(key);
    },

    setItem: (key: string, value: string, options?: CookieOptions): void => {
        setCookie(key, value, options);
    },

    removeItem: (key: string): void => {
        removeCookie(key);
    },

    clear: (): void => {
        // Get all cookies and remove them
        const cookies = document.cookie.split(';');
        cookies.forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name) {
                removeCookie(name);
            }
        });
    }
};

