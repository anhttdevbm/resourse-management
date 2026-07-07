import axios from "axios"
import { toast } from "react-toastify"

const API_ERROR_MESSAGES: Record<string, string> = {
    BE0049: "Không tìm thấy tài khoản với email này trong hệ thống. Người nhận cần đăng ký hoặc đăng nhập trước.",
    BE0050: "Bạn không thể chia sẻ tài nguyên cho chính mình.",
    BE0051: "Tài nguyên chưa được duyệt hoặc không khả dụng. Chỉ chủ sở hữu và admin mới có thể truy cập.",
    BE0052: "Chỉ có thể chia sẻ tài nguyên đã được duyệt (Approved).",
    BE0053: "Tài nguyên chưa được duyệt. Chỉ chủ sở hữu và admin mới có thể tải xuống.",
};

const parseApiErrorData = (data: unknown): { message?: string; code?: string } => {
    if (!data) return {};
    if (typeof data === "string") {
        try {
            return parseApiErrorData(JSON.parse(data));
        } catch {
            return { message: data };
        }
    }
    if (typeof data === "object") {
        const payload = data as { message?: string; code?: string; detail?: unknown };
        if (typeof payload.message === "string" && payload.message) {
            return { message: payload.message, code: payload.code };
        }
        if (Array.isArray(payload.detail)) {
            const detailMessage = payload.detail
                .map((item) => (typeof item === "object" && item && "msg" in item ? String((item as { msg?: string }).msg ?? "") : ""))
                .filter(Boolean)
                .join(". ");
            if (detailMessage) return { message: detailMessage };
        }
        if (typeof payload.detail === "string" && payload.detail) {
            return { message: payload.detail };
        }
        if (typeof payload.code === "string" && API_ERROR_MESSAGES[payload.code]) {
            return { message: API_ERROR_MESSAGES[payload.code], code: payload.code };
        }
    }
    return {};
};

const extractApiErrorMessage = (error: unknown): string | null => {
    if (!axios.isAxiosError(error)) return null;
    const parsed = parseApiErrorData(error.response?.data);
    if (parsed.code && API_ERROR_MESSAGES[parsed.code]) {
        return API_ERROR_MESSAGES[parsed.code];
    }
    return parsed.message ?? null;
};

/** Lấy message lỗi từ response API (BusinessException) thay vì text HTTP mặc định của axios. */
const getApiErrorMessage = (error: unknown, fallback = "Đã xảy ra lỗi. Vui lòng thử lại."): string => {
    const apiMessage = extractApiErrorMessage(error);
    if (apiMessage) return apiMessage;
    if (error instanceof Error && error.message && !error.message.startsWith("Request failed with status code")) {
        return error.message;
    }
    return fallback;
};

const handleAxiosError = (error: unknown): void => {
    toast.error(getApiErrorMessage(error, "Đã xảy ra lỗi không được xác định. Hãy thử lại sau."));
}
export { handleAxiosError, getApiErrorMessage, extractApiErrorMessage }