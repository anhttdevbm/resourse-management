export interface NotificationItem {
    id: string
    user_id: string
    title: string
    message: string
    type: string
    source: string
    payload?: Record<string, unknown> | null
    link?: string | null
    is_read: boolean
    created_at: string
    read_at?: string | null
    expires_at?: string | null
}

export interface NotificationPage {
    items: NotificationItem[]
    total: number
    unread: number
    page: number
    page_size: number
}

