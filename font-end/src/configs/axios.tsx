import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { cookieStorage } from "../utils/cookie";

const resolveBaseUrl = (): string => {
    const fromEnv = import.meta.env.VITE_API_URL;
    if (fromEnv !== undefined && fromEnv !== '') {
        return fromEnv.endsWith('/') ? fromEnv : `${fromEnv}/`;
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
        return `${window.location.origin}/`;
    }
    return 'http://localhost:30111/';
};

/** Origin for full-page redirects (OAuth) — no trailing slash */
export const getApiOrigin = (): string => {
    const fromEnv = import.meta.env.VITE_API_URL;
    if (fromEnv !== undefined && fromEnv !== '') {
        return fromEnv.replace(/\/$/, '');
    }
    if (typeof window !== 'undefined' && window.location?.origin) {
        return window.location.origin;
    }
    return 'http://localhost:30111';
};

export const baseURL = resolveBaseUrl();

axios.defaults.baseURL = encodeURI(baseURL);
axios.defaults.withCredentials = true;
axios.defaults.headers.common['Content-Type'] = 'application/json';
axios.defaults.headers.common['Accept'] = 'application/json';

const apiCall: AxiosInstance = axios.create({
    baseURL: encodeURI(baseURL),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

const noAuthAxios = axios.create({
    baseURL: encodeURI(baseURL),
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
    },
});

const setAuthorizationHeader = (token: string) => {
    const bearer = `Bearer ${token}`;
    axios.defaults.headers.common['Authorization'] = bearer;
    apiCall.defaults.headers.common['Authorization'] = bearer;
};

// Thêm token vào header cho mọi request
axios.interceptors.request.use(
    (config) => {
        const token = cookieStorage.getItem("accessToken");
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Thêm token vào header cho apiCall
apiCall.interceptors.request.use(
    (config) => {
        const token = cookieStorage.getItem("accessToken");
        if (token) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

let isRefreshing = false;
let failedQueue: Array<{
    resolve: (value?: any) => void;
    reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach(({ resolve, reject }) => {
        if (error) {
            reject(error);
        } else {
            resolve(token);
        }
    });
    
    failedQueue = [];
};

const refreshToken = async (): Promise<string> => {
    try {
        const storedRefreshToken = cookieStorage.getItem("refreshToken");
        const storedUser = cookieStorage.getItem("user");

        if (!storedRefreshToken || !storedUser) {
            throw new Error("Không tìm thấy refresh token hoặc user trong cookie");
        }

        const user = JSON.parse(storedUser);

        const response = await noAuthAxios.post('/api/auth/user/refresh-token',
            {
                refresh_token: storedRefreshToken,
                user: user,
            },
            {
                headers: {
                    Authorization: `Bearer ${storedRefreshToken}`,
                }
            }
        );

        console.log("Phản hồi từ API refresh:", response.data);

        const newToken = response.data?.data?.access_token;

        if (newToken) {
            cookieStorage.setItem("accessToken", newToken, { expires: 7 });
            setAuthorizationHeader(newToken);
            return newToken;
        }

        throw new Error("Không nhận được accessToken mới");
    } catch (err) {
        console.error("Lỗi khi refresh token:", err);
        // Xóa token cũ nếu refresh thất bại
        cookieStorage.removeItem("accessToken");
        cookieStorage.removeItem("refreshToken");
        cookieStorage.removeItem("user");
        throw new Error('Không thể khởi tạo accessToken');
    }
};

// Xử lý response interceptor cho axios chính
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        // Chỉ xử lý lỗi 401 (Unauthorized) hoặc 400 với thông báo token hết hạn
        if ((error.response?.status === 401 || 
             (error.response?.status === 400 && error.response?.data?.detail?.includes?.('Expired'))) && 
            !originalRequest._retry) {
            
            if (isRefreshing) {
                // Nếu đang refresh, thêm request vào queue
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers!.Authorization = `Bearer ${token}`;
                    return axios(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await refreshToken();
                processQueue(null, newToken);
                
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                } else {
                    originalRequest.headers = {
                        Authorization: `Bearer ${newToken}`,
                    };
                }

                return axios(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                console.error("Lỗi khi refresh token:", refreshError);
                
                // Chuyển về trang login nếu refresh thất bại
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

// Xử lý response interceptor cho apiCall
apiCall.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

        if ((error.response?.status === 401 || 
             (error.response?.status === 400 && error.response?.data?.detail?.includes?.('Expired'))) && 
            !originalRequest._retry) {
            
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject });
                }).then(token => {
                    originalRequest.headers!.Authorization = `Bearer ${token}`;
                    return apiCall(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                const newToken = await refreshToken();
                processQueue(null, newToken);
                
                if (originalRequest.headers) {
                    originalRequest.headers.Authorization = `Bearer ${newToken}`;
                } else {
                    originalRequest.headers = {
                        Authorization: `Bearer ${newToken}`,
                    };
                }

                return apiCall(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                console.error("Lỗi khi refresh token:", refreshError);
                
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
                
                return Promise.reject(refreshError);
            } finally {
                isRefreshing = false;
            }
        }

        return Promise.reject(error);
    }
);

export { apiCall };
export default axios;
