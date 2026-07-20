import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { RootState } from "../redux/store";
import {
    addNotification,
    setNotifications,
    setStreamingStatus,
} from "../redux/slice/notificationSlice";
import { getApiOrigin } from "../configs/axios";
import { fetchNotifications, createNotificationStreamTicket } from "../services/notificationService";

export const useNotificationStream = () => {
    const dispatch = useDispatch();
    const { isAuthenticated } = useSelector((state: RootState) => state.auth);
    const reconnectTimer = useRef<number>();
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const loadInitial = async () => {
            const data = await fetchNotifications();
            if (data) {
                dispatch(setNotifications(data));
            }
        };

        const connectStream = async () => {
            try {
                const ticket = await createNotificationStreamTicket();
                if (!ticket) {
                    return;
                }
                const streamUrl = `${getApiOrigin()}/resource-management/notifications/stream?ticket=${encodeURIComponent(ticket)}`;
                const eventSource = new EventSource(streamUrl);
                eventSourceRef.current = eventSource;

                eventSource.onopen = () => {
                    dispatch(setStreamingStatus(true));
                };

                eventSource.onmessage = (event) => {
                    try {
                        const payload = JSON.parse(event.data);
                        dispatch(addNotification(payload));
                        toast.info(payload.title ?? "Bạn có thông báo mới");
                    } catch (error) {
                        console.error("Notification parse error:", error);
                    }
                };

                eventSource.onerror = () => {
                    dispatch(setStreamingStatus(false));
                    eventSource.close();
                    if (!reconnectTimer.current) {
                        reconnectTimer.current = window.setTimeout(() => {
                            reconnectTimer.current = undefined;
                            void connectStream();
                        }, 5000);
                    }
                };
            } catch (error) {
                console.error("Notification stream connect failed:", error);
                dispatch(setStreamingStatus(false));
            }
        };

        if (isAuthenticated) {
            loadInitial();
            void connectStream();
        } else {
            dispatch(setStreamingStatus(false));
            eventSourceRef.current?.close();
            eventSourceRef.current = null;
        }

        return () => {
            eventSourceRef.current?.close();
            if (reconnectTimer.current) {
                window.clearTimeout(reconnectTimer.current);
            }
        };
    }, [dispatch, isAuthenticated]);
};
