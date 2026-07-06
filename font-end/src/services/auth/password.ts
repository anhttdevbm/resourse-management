import axiosInstance from "../../configs/axios";

export const forgotPassword = async (email: string): Promise<boolean> => {
    try {
        const response = await axiosInstance.post("/api/auth/forgot-password", { email });
        return response.data.code === "AUTH0000";
    } catch (error: any) {
        console.error("Forgot password error:", error);
        return false;
    }
};

export const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
        const response = await axiosInstance.post("/api/auth/reset-password", {
            token,
            new_password: newPassword,
        });
        return response.data.code === "AUTH0000";
    } catch (error: any) {
        console.error("Reset password error:", error);
        return false;
    }
};
