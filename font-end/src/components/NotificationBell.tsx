import { useState } from "react";
import { GoBell } from "react-icons/go";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { RootState } from "../redux/store";
import {
    markAllNotificationReadState,
    markNotificationReadState,
    setNotifications,
} from "../redux/slice/notificationSlice";
import {
    fetchNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from "../services/notificationService";
import { NotificationItem } from "../types/Notification";

const formatDate = (value: string) => {
    try {
        return new Date(value).toLocaleString("vi-VN");
    } catch {
        return value;
    }
};

const NotificationBell = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { items, unread } = useSelector((state: RootState) => state.notifications);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const topNotifications = items.slice(0, 5);

    const handleOpenChange = async (open: boolean) => {
        setIsOpen(open);
        if (open && !hasLoaded) {
            setLoading(true);
            const data = await fetchNotifications();
            if (data) {
                dispatch(setNotifications(data));
                setHasLoaded(true);
            }
            setLoading(false);
        }
    };

    const handleMarkRead = async (notification: NotificationItem) => {
        if (notification.is_read) return;
        const result = await markNotificationRead(notification.id);
        if (result) {
            dispatch(markNotificationReadState(notification.id));
        }
    };

    const handleMarkAll = async () => {
        const updated = await markAllNotificationsRead();
        if (updated !== null) {
            dispatch(markAllNotificationReadState());
        }
    };

    const handleViewAll = () => {
        setIsOpen(false);
        navigate("/notifications");
    };

    return (
        <DropdownMenu open={isOpen} onOpenChange={handleOpenChange}>
            <DropdownMenuTrigger className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer relative">
                <GoBell className="text-xl text-gray-600 hover:text-gray-800" />
                {unread > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-80" align="end">
                <DropdownMenuLabel className="flex items-center justify-between">
                    <span>Thông báo</span>
                    <button
                        className="text-sm text-blue-600 hover:underline disabled:text-gray-400"
                        onClick={handleMarkAll}
                        disabled={unread === 0}
                    >
                        Đánh dấu đã đọc
                    </button>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="max-h-80 overflow-y-auto">
                    {loading && <div className="p-4 text-center text-sm text-gray-500">Đang tải...</div>}
                    {!loading && topNotifications.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-500">Chưa có thông báo</div>
                    )}
                    {!loading &&
                        topNotifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex flex-col items-start gap-1 cursor-pointer ${
                                    notification.is_read ? "bg-white" : "bg-gray-50"
                                }`}
                                onClick={() => handleMarkRead(notification)}
                            >
                                <div className="flex items-center justify-between w-full">
                                    <span className="font-semibold text-sm">{notification.title}</span>
                                    {!notification.is_read && (
                                        <span className="text-xs text-blue-500 font-medium">Mới</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-600 overflow-hidden text-ellipsis max-h-12">
                                    {notification.message}
                                </p>
                                <span className="text-xs text-gray-400">{formatDate(notification.created_at)}</span>
                            </DropdownMenuItem>
                        ))}
                </div>
                <DropdownMenuSeparator />
                <button
                    className="w-full text-center text-sm text-blue-600 py-2 hover:bg-gray-50"
                    onClick={handleViewAll}
                >
                    Xem tất cả thông báo
                </button>
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

export default NotificationBell;

