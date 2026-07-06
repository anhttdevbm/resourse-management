import axios from "axios";
import axiosInstance from "../../configs/axios";
import { handleAxiosError } from "../../helpers/axiosHelper";
import { User } from "../../types/User";
import { cookieStorage } from "../../utils/cookie";

export type LoginPayload = {
    email: string;
    password: string;
};

export const login = async (payload: LoginPayload): Promise<User | null> => {
    try {
        const response = await axiosInstance.post("/api/auth/user/login", {
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
        handleAxiosError(error);
        return null;
    }
};
