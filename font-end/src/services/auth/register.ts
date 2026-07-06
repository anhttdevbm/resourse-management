import axios from "axios";
import { toast } from "react-toastify";
import axiosInstance from "../../configs/axios";
import { handleAxiosError } from "../../helpers/axiosHelper";
import { User } from "../../types/User";
import { cookieStorage } from "../../utils/cookie";

export type RegisterPayload = {
    name: string;
    email: string;
    password: string;
};

export const register = async (payload: RegisterPayload): Promise<User | null> => {
    try {
        const response = await axiosInstance.post("/api/auth/user/register", {
            name: payload.name,
            email: payload.email,
            password: payload.password,
        });
        const user = response.data.data.user;
        const accessToken = response.data.data.token.access_token;
        const refreshToken = response.data.data.token.refresh_token;

        if (accessToken) {
            cookieStorage.setItem("accessToken", accessToken, { expires: 7 });
            cookieStorage.setItem("refreshToken", refreshToken, { expires: 30 });
            cookieStorage.setItem("user", JSON.stringify(user), { expires: 7 });
        }

        return user;
    } catch (error) {
        if (
            axios.isAxiosError(error) &&
            (error.response?.data?.code === "AUTH0008" || error.response?.data?.code === "AUTH0016")
        ) {
            toast.error(
                "Email này đã được đăng ký. Hãy đăng nhập hoặc dùng Quên mật khẩu nếu bạn đã có tài khoản."
            );
            return null;
        }
        handleAxiosError(error);
        return null;
    }
};
