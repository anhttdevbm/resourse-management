import axiosInstance, { getApiOrigin } from "../../configs/axios";
import { User } from "../../types/User";
import { cookieStorage } from "../../utils/cookie";

export const facebookLogin = async (): Promise<void> => {
    window.location.href = `${getApiOrigin()}/api/auth/login/facebook`;
};

export const twitterLogin = async (): Promise<void> => {
    window.location.href = `${getApiOrigin()}/api/auth/login/twitter`;
};

export const googleLogin = async (): Promise<void> => {
    window.location.href = `${getApiOrigin()}/api/auth/login/google`;
};

export const githubLogin = async (): Promise<void> => {
    window.location.href = `${getApiOrigin()}/api/auth/login/github`;
};

export const handleFacebookCallback = async (code: string): Promise<User | null> => {
    try {
        const response = await axiosInstance.get(`/resource-management/facebook/callback?code=${code}`);
        const tokenData = response.data;

        if (tokenData.access_token) {
            cookieStorage.setItem("accessToken", tokenData.access_token, { expires: 7 });
            cookieStorage.setItem("tokenType", tokenData.token_type, { expires: 7 });

            const userResponse = await axiosInstance.get("/resource-management/users/me");
            const user = userResponse.data.data;
            cookieStorage.setItem("user", JSON.stringify(user), { expires: 7 });

            return user;
        }
        return null;
    } catch (error) {
        console.error("Facebook callback error:", error);
        return null;
    }
};

export const handleTwitterCallback = async (code: string, codeVerifier?: string): Promise<User | null> => {
    let url = `/api/auth/twitter/callback?code=${code}`;
    if (codeVerifier) {
        url += `&code_verifier=${codeVerifier}`;
    }
    window.location.href = `${getApiOrigin()}${url}`;
    return null;
};

export const handleGoogleCallback = async (code: string): Promise<User | null> => {
    window.location.href = `${getApiOrigin()}/api/auth/google/callback?code=${code}`;
    return null;
};

export const handleGithubCallback = async (code: string): Promise<User | null> => {
    window.location.href = `${getApiOrigin()}/api/auth/github/callback?code=${code}`;
    return null;
};
