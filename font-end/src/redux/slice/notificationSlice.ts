import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { NotificationItem, NotificationPage } from "../../types/Notification";

export interface NotificationState {
    items: NotificationItem[];
    total: number;
    unread: number;
    page: number;
    pageSize: number;
    isStreaming: boolean;
}

const initialState: NotificationState = {
    items: [],
    total: 0,
    unread: 0,
    page: 1,
    pageSize: 10,
    isStreaming: false,
};

const notificationSlice = createSlice({
    name: "notifications",
    initialState,
    reducers: {
        setNotifications: (state, action: PayloadAction<NotificationPage>) => {
            state.items = action.payload.items;
            state.total = action.payload.total;
            state.unread = action.payload.unread;
            state.page = action.payload.page;
            state.pageSize = action.payload.page_size;
        },
        addNotification: (state, action: PayloadAction<NotificationItem>) => {
            const exists = state.items.find((item) => item.id === action.payload.id);
            if (!exists) {
                state.items = [action.payload, ...state.items].slice(0, state.pageSize);
                state.total += 1;
                state.unread += 1;
            }
        },
        markNotificationReadState: (state, action: PayloadAction<string>) => {
            state.items = state.items.map((item) =>
                item.id === action.payload ? { ...item, is_read: true, read_at: new Date().toISOString() } : item
            );
            state.unread = Math.max(0, state.unread - 1);
        },
        markAllNotificationReadState: (state) => {
            state.items = state.items.map((item) => ({ ...item, is_read: true, read_at: item.read_at ?? new Date().toISOString() }));
            state.unread = 0;
        },
        setStreamingStatus: (state, action: PayloadAction<boolean>) => {
            state.isStreaming = action.payload;
        },
    },
});

export const {
    setNotifications,
    addNotification,
    markNotificationReadState,
    markAllNotificationReadState,
    setStreamingStatus,
} = notificationSlice.actions;

export default notificationSlice.reducer;

