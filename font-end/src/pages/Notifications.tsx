import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import {
    setNotifications,
    markNotificationReadState,
    markAllNotificationReadState,
} from "../redux/slice/notificationSlice";
import {
    fetchNotifications,
    markNotificationRead,
    markAllNotificationsRead,
} from "../services/notificationService";
import { NotificationItem } from "../types/Notification";

const NotificationsPage = () => {
    const dispatch = useDispatch();
    const { items, page, pageSize, total, unread } = useSelector((state: RootState) => state.notifications);
    const [currentPage, setCurrentPage] = useState(page);
    const [loading, setLoading] = useState(false);
    const totalPages = Math.max(1, Math.ceil(total / pageSize));

    useEffect(() => {
        loadPage(currentPage);
    }, [currentPage]);

    const loadPage = async (targetPage: number) => {
        setLoading(true);
        const data = await fetchNotifications(targetPage, pageSize);
        if (data) {
            dispatch(setNotifications(data));
        }
        setLoading(false);
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

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold">Thông báo</h1>
                    <p className="text-sm text-gray-500">Có {unread} thông báo chưa đọc</p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:bg-gray-300"
                        disabled={unread === 0}
                        onClick={handleMarkAll}
                    >
                        Đánh dấu tất cả đã đọc
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Tiêu đề
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Nội dung
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Thời gian
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Trạng thái
                            </th>
                            <th className="px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {loading && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        )}
                        {!loading && items.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                                    Không có thông báo
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            items.map((notification: NotificationItem) => (
                                <tr key={notification.id} className={notification.is_read ? "" : "bg-gray-50"}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">{notification.title}</div>
                                        <div className="text-xs text-gray-400">{notification.type}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-700">{notification.message}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {new Date(notification.created_at).toLocaleString("vi-VN")}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {notification.is_read ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Đã đọc
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                Chưa đọc
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right text-sm font-medium">
                                        {!notification.is_read && (
                                            <button
                                                onClick={() => handleMarkRead(notification)}
                                                className="text-blue-600 hover:text-blue-900"
                                            >
                                                Đánh dấu đọc
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    Trang {currentPage} / {totalPages}
                </p>
                <div className="space-x-2">
                    <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                        Trước
                    </button>
                    <button
                        className="px-3 py-1 border rounded disabled:opacity-50"
                        disabled={currentPage >= totalPages}
                        onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    >
                        Sau
                    </button>
                </div>
            </div>
        </div>
    );
};

export default NotificationsPage;

