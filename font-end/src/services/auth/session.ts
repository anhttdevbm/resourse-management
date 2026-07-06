import axiosInstance from "../../configs/axios";
import { User } from "../../types/User";
import { applyTheme } from "../../utils/applyTheme";
import { cookieStorage } from "../../utils/cookie";

export const fetchUser = async (): Promise<User | null> => {
    try {
        const response = await axiosInstance.get("/resource-management/users/me");
        const user = response.data.data;
        if (user) {
            cookieStorage.setItem("user", JSON.stringify(user), { expires: 7 });
        }
        return user;
    } catch (error: any) {
        if (
            error.response?.status === 401 ||
            (error.response?.status === 400 && error.response?.data?.detail?.includes?.("Expired"))
        ) {
            console.log("Token expired or invalid, user needs to login again");
            return null;
        }

        console.error("Error fetching user:", error);
        return null;
    }
};

const clearLocalAuth = (): void => {
    cookieStorage.removeItem("accessToken");
    cookieStorage.removeItem("refreshToken");
    cookieStorage.removeItem("user");
    cookieStorage.removeItem("tokenType");
    applyTheme("light");
};

export const logout = async (): Promise<void> => {
    const accessToken = cookieStorage.getItem("accessToken");
    try {
        if (accessToken) {
            await axiosInstance.post("/api/auth/user/logout");
        }
    } catch (error) {
        console.warn("Backend logout failed (local session will still be cleared):", error);
    } finally {
        clearLocalAuth();
    }
};
