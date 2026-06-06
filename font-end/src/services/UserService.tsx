import axios from "../configs/axios";
import { handleAxiosError } from "../helpers/axiosHelper";
import { User, UserUpdatePayload, UserAppSettings } from "../types/User";

const pagination = async (page = 1, pageSize = 10) => {
    try {
        const response = await axios.get('/resource-management/users', {
            params: { page, page_size: pageSize }
        });
        if (response.data && response.data.data && typeof response.data.data === 'object') {
            // API mới trả về { users, total, page, page_size }
            return response.data.data;
        }
        return { users: [], total: 0, page, page_size: pageSize };
    } catch (error) {
        handleAxiosError(error);
        return { users: [], total: 0, page, page_size: pageSize };
    }
}

const getCurrentUser = async (): Promise<User | null> => {
    try {
        const response = await axios.get('/resource-management/users/me');
        return response.data.data as User;
    } catch (error) {
        handleAxiosError(error);
        return null;
    }
}

const updateCurrentUser = async (payload: UserUpdatePayload): Promise<User | null> => {
    try {
        const response = await axios.patch('/resource-management/users/me', payload);
        return response.data.data as User;
    } catch (error) {
        handleAxiosError(error);
        return null;
    }
}

const uploadAvatar = async (file: File): Promise<User | null> => {
    try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await axios.post('/resource-management/users/me/avatar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data.data as User;
    } catch (error) {
        handleAxiosError(error);
        return null;
    }
}

const changePassword = async (oldPassword: string, newPassword: string): Promise<boolean> => {
    try {
        const response = await axios.post('/resource-management/users/me/change-password', {
            old_password: oldPassword,
            new_password: newPassword
        });
        return response.data.code === "BE0000";
    } catch (error) {
        handleAxiosError(error);
        return false;
    }
}

const getUserSettings = async (): Promise<UserAppSettings | null> => {
    try {
        const response = await axios.get('/resource-management/users/me/settings');
        if (response.data?.code === 'BE0000' && response.data?.data) {
            return response.data.data as UserAppSettings;
        }
        return null;
    } catch (error) {
        handleAxiosError(error);
        return null;
    }
};

const patchUserSettings = async (patch: Partial<UserAppSettings>): Promise<UserAppSettings | null> => {
    try {
        const response = await axios.patch('/resource-management/users/me/settings', patch);
        if (response.data?.code === 'BE0000' && response.data?.data) {
            return response.data.data as UserAppSettings;
        }
        return null;
    } catch (error) {
        handleAxiosError(error);
        return null;
    }
};

export { pagination, getCurrentUser, updateCurrentUser, uploadAvatar, changePassword, getUserSettings, patchUserSettings };
