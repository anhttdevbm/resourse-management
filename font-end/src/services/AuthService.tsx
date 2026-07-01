import axiosInstance, { getApiOrigin } from "../configs/axios";
import { handleAxiosError } from "../helpers/axiosHelper";
import { User } from "../types/User";
import { cookieStorage } from "../utils/cookie";
import { applyTheme } from "../utils/applyTheme";

type LOGINPAYLOAD = {
    email: string,
    password: string
};

const login = async (payload: LOGINPAYLOAD): Promise<User | null> => {
    try {
        const response = await axiosInstance.post('/api/auth/user/login', {
            email: payload.email,
            password: payload.password,
        });
        console.log(response)
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

const facebookLogin = async (): Promise<void> => {
    try {
        window.location.href = `${getApiOrigin()}/api/auth/login/facebook`;
    } catch (error) {
        console.error('Facebook login error:', error);
        throw error;
    }
};

const twitterLogin = async (): Promise<void> => {
    try {
        window.location.href = `${getApiOrigin()}/api/auth/login/twitter`;
    } catch (error) {
        console.error('Twitter login error:', error);
        throw error;
    }
};

const googleLogin = async (): Promise<void> => {
    try {
        window.location.href = `${getApiOrigin()}/api/auth/login/google`;
    } catch (error) {
        console.error('Google login error:', error);
        throw error;
    }
};

const githubLogin = async (): Promise<void> => {
    try {
        window.location.href = `${getApiOrigin()}/api/auth/login/github`;
    } catch (error) {
        console.error('GitHub login error:', error);
        throw error;
    }
};

const handleFacebookCallback = async (code: string): Promise<User | null> => {
    try {
        const response = await axiosInstance.get(`/resource-management/facebook/callback?code=${code}`);
        const tokenData = response.data;
        
        if (tokenData.access_token) {
            cookieStorage.setItem("accessToken", tokenData.access_token, { expires: 7 });
            cookieStorage.setItem("tokenType", tokenData.token_type, { expires: 7 });
            
            // Fetch user info using the token
            const userResponse = await axiosInstance.get('/resource-management/users/me');
            const user = userResponse.data.data;
            cookieStorage.setItem("user", JSON.stringify(user), { expires: 7 });
            
            return user;
        }
        return null;
    } catch (error) {
        console.error('Facebook callback error:', error);
        return null;
    }
};

const handleTwitterCallback = async (code: string, codeVerifier?: string): Promise<User | null> => {
    try {
        let url = `/api/auth/twitter/callback?code=${code}`;
        if (codeVerifier) {
            url += `&code_verifier=${codeVerifier}`;
        }
        
        // This will redirect to frontend with tokens, so we don't need to handle response here
        window.location.href = `${getApiOrigin()}${url}`;
        return null;
    } catch (error) {
        console.error('Twitter callback error:', error);
        return null;
    }
};

const handleGoogleCallback = async (code: string): Promise<User | null> => {
    try {
        const url = `/api/auth/google/callback?code=${code}`;

        window.location.href = `${getApiOrigin()}${url}`;
        return null;
    } catch (error) {
        console.error('Google callback error:', error);
        return null;
    }
};

const handleGithubCallback = async (code: string): Promise<User | null> => {
    try {
        const url = `/api/auth/github/callback?code=${code}`;

        window.location.href = `${getApiOrigin()}${url}`;
        return null;
    } catch (error) {
        console.error('GitHub callback error:', error);
        return null;
    }
};

const fetchUser = async (): Promise<User | null> => {
    try {
        const response = await axiosInstance.get('/resource-management/users/me');
        const user = response.data.data;
        if (user) {
            cookieStorage.setItem("user", JSON.stringify(user), { expires: 7 });
        }
        return user;
    } catch (error: any) {
        // Không log error cho token hết hạn vì đây là behavior bình thường
        if (error.response?.status === 401 || 
            (error.response?.status === 400 && error.response?.data?.detail?.includes?.('Expired'))) {
            console.log('Token expired or invalid, user needs to login again');
            return null;
        }
        
        // Chỉ log các lỗi khác
        console.error('Error fetching user:', error);
        return null;
    }
};

const forgotPassword = async (email: string): Promise<boolean> => {
    try {
        const response = await axiosInstance.post('/api/auth/forgot-password', {
            email: email
        });
        return response.data.code === "AUTH0000";
    } catch (error: any) {
        console.error('Forgot password error:', error);
        return false;
    }
};

const resetPassword = async (token: string, newPassword: string): Promise<boolean> => {
    try {
        const response = await axiosInstance.post('/api/auth/reset-password', {
            token: token,
            new_password: newPassword
        });
        return response.data.code === "AUTH0000";
    } catch (error: any) {
        console.error('Reset password error:', error);
        return false;
    }
};

const clearLocalAuth = (): void => {
    cookieStorage.removeItem("accessToken");
    cookieStorage.removeItem("refreshToken");
    cookieStorage.removeItem("user");
    cookieStorage.removeItem("tokenType");
    applyTheme("light");
};

const logout = async (): Promise<void> => {
    const accessToken = cookieStorage.getItem("accessToken");
    try {
        if (accessToken) {
            await axiosInstance.post('/api/auth/user/logout');
        }
    } catch (error) {
        // Token may already be expired; still clear local session
        console.warn('Backend logout failed (local session will still be cleared):', error);
    } finally {
        clearLocalAuth();
    }
};

export { login, fetchUser, forgotPassword, resetPassword, logout, facebookLogin, twitterLogin, googleLogin, githubLogin, handleFacebookCallback, handleTwitterCallback, handleGoogleCallback, handleGithubCallback };
