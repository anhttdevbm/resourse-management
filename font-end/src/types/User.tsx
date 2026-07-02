export interface User {
    id: string,
    email: string,
    name: string,
    avatar_url?: string | null,
    permissions?: string[]
}

export interface UserUpdatePayload {
    name?: string;
    email?: string;
    password?: string;
    avatar_url?: string;
    is_locked?: boolean;
}

/** Cài đặt ứng dụng (API GET/PATCH /users/me/settings) */
export interface UserAppSettings {
    theme: 'light' | 'dark' | 'system';
    locale: 'vi' | 'en';
    dense_ui: boolean;
    default_page_size: number;
    show_dashboard_tips: boolean;
    notify_resource_updates: boolean;
}