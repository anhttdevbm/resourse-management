import axiosInstance from '../configs/axios';

export interface SystemInfo {
    id: string;
    system_name: string;
    status: string;
    version: string;
    created_at: string;
    updated_at: string;
}

export const getSystemInfo = async (): Promise<SystemInfo> => {
    try {
        console.log('🔄 Calling system-info API...');
        const response = await axiosInstance.get('/resource-management/system-info');
        console.log('📊 System info API response:', response.data);
        
        if (!response.data || !response.data.data) {
            throw new Error('Invalid response format');
        }
        
        return response.data.data;
    } catch (error) {
        console.error('❌ Error fetching system info:', error);
        throw error;
    }
};

export const updateSystemInfo = async (systemInfo: Partial<SystemInfo>): Promise<SystemInfo> => {
    try {
        const response = await axiosInstance.put('/resource-management/system-info', systemInfo);
        return response.data.data;
    } catch (error) {
        console.error('Error updating system info:', error);
        throw error;
    }
};
