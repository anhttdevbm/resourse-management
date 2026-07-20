import axiosInstance from "../configs/axios";
import { handleAxiosError } from "../helpers/axiosHelper";
import { NotificationItem, NotificationPage } from "../types/Notification";

const BASE_URL = "/resource-management/notifications";

export interface NotificationCreatePayload {
    title: string;
    message: string;
    type?: string;
    source?: string;
    payload?: Record<string, unknown> | null;
    link?: string | null;
    user_id?: string;
    user_ids?: string[];
    expires_at?: string | null;
}

export const fetchNotifications = async (page = 1, pageSize = 10): Promise<NotificationPage | null> => {
    try {
        const response = await axiosInstance.get(BASE_URL, {
            params: {
                page,
                page_size: pageSize,
            },
        });
        return response.data.data as NotificationPage;
    } catch (error) {
        handleAxiosError(error);
        return null;
    }
};

export const markNotificationRead = async (notificationId: string): Promise<NotificationItem | null> => {
    try {
        const response = await axiosInstance.patch(`${BASE_URL}/${notificationId}/read`);
        return response.data.data as NotificationItem;
    } catch (error) {
        handleAxiosError(error);
        return null;
    }
};

export const markAllNotificationsRead = async (): Promise<number | null> => {
    try {
        const response = await axiosInstance.patch(`${BASE_URL}/read-all`);
        return response.data.data?.updated ?? 0;
    } catch (error) {
        handleAxiosError(error);
        return null;
    }
};

export const createNotification = async (payload: NotificationCreatePayload): Promise<NotificationItem[] | null> => {
    try {
        const response = await axiosInstance.post(BASE_URL, payload);
        return response.data.data as NotificationItem[];
    } catch (error) {
        handleAxiosError(error);
        return null;
    }
};

export const createNotificationStreamTicket = async (): Promise<string | null> => {
    try {
        const response = await axiosInstance.post(`${BASE_URL}/stream-ticket`);
        return (response.data?.data?.ticket as string) ?? null;
    } catch (error) {
        handleAxiosError(error);
        return null;
    }
};

