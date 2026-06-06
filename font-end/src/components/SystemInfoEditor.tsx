import React, { useState, useEffect } from 'react';
import { HiPencil, HiCheck, HiX } from 'react-icons/hi';
import { getSystemInfo, updateSystemInfo, SystemInfo as SystemInfoType } from '../services/SystemInfoService';
import { useAuth } from '../contexts/AuthContext';

interface SystemInfo {
    status: string;
    version: string;
    systemName: string;
}

const SystemInfoEditor: React.FC = () => {
    const { isAdmin, hasPermission } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [systemInfo, setSystemInfo] = useState<SystemInfo>({
        status: 'Online',
        version: 'v1.0.0',
        systemName: 'Hệ thống'
    });

    const [editData, setEditData] = useState<SystemInfo>({
        status: 'Online',
        version: 'v1.0.0',
        systemName: 'Hệ thống'
    });

    // Load system info from backend
    useEffect(() => {
        const loadSystemInfo = async () => {
            try {
                console.log('🔄 Loading system info...');
                const data = await getSystemInfo();
                console.log('📊 System info data:', data);
                
                // Handle case where data might be an array
                let systemInfoData = data;
                if (Array.isArray(data)) {
                    console.log('⚠️ Data is array, taking first element');
                    systemInfoData = data[0];
                }
                
                const localSystemInfo: SystemInfo = {
                    status: systemInfoData.status,
                    version: systemInfoData.version,
                    systemName: systemInfoData.system_name
                };
                console.log('✅ Local system info:', localSystemInfo);
                
                setSystemInfo(localSystemInfo);
                setEditData(localSystemInfo);
            } catch (error) {
                console.error('❌ Failed to load system info:', error);
            } finally {
                setLoading(false);
            }
        };

        loadSystemInfo();
    }, []);

    const handleEdit = () => {
        setEditData(systemInfo);
        setIsEditing(true);
    };

    const handleSave = async () => {
        try {
            const updateData = {
                system_name: editData.systemName,
                status: editData.status,
                version: editData.version
            };
            
            const updatedData = await updateSystemInfo(updateData);
            const localSystemInfo: SystemInfo = {
                status: updatedData.status,
                version: updatedData.version,
                systemName: updatedData.system_name
            };
            
            setSystemInfo(localSystemInfo);
            setIsEditing(false);
        } catch (error) {
            console.error('Failed to update system info:', error);
            alert('Không thể cập nhật thông tin hệ thống. Chỉ admin mới có quyền chỉnh sửa.');
        }
    };

    const handleCancel = () => {
        setEditData(systemInfo);
        setIsEditing(false);
    };

    const handleChange = (field: keyof SystemInfo, value: string) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Debug logs
    console.log('🔍 SystemInfoEditor render - loading:', loading, 'systemInfo:', systemInfo);

    if (loading) {
        return (
            <div className="px-3 mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 text-xs">
                <div className="flex items-center justify-center py-4">
                    <div className="text-gray-400">Đang tải thông tin hệ thống...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="px-3 mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 text-xs">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 font-medium">{systemInfo.systemName}</span>
                </div>
                {!isEditing && (isAdmin || hasPermission('AllAccess')) && (
                    <button
                        onClick={handleEdit}
                        className="p-1 hover:bg-gray-700 rounded text-gray-400 hover:text-white transition-colors"
                        title="Chỉnh sửa thông tin hệ thống (Admin/AllAccess)"
                    >
                        <HiPencil className="w-3 h-3" />
                    </button>
                )}
            </div>

            {isEditing ? (
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tên hệ thống:</span>
                        <input
                            type="text"
                            value={editData.systemName}
                            onChange={(e) => handleChange('systemName', e.target.value)}
                            className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-green-400 focus:outline-none w-24"
                        />
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Trạng thái:</span>
                        <select
                            value={editData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-green-400 focus:outline-none"
                        >
                            <option value="Online">Online</option>
                            <option value="Offline">Offline</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Phiên bản:</span>
                        <input
                            type="text"
                            value={editData.version}
                            onChange={(e) => handleChange('version', e.target.value)}
                            className="bg-gray-700 text-white text-xs px-2 py-1 rounded border border-gray-600 focus:border-green-400 focus:outline-none w-20"
                        />
                    </div>
                    <div className="flex gap-2 justify-end mt-3">
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded transition-colors"
                        >
                            <HiCheck className="w-3 h-3" />
                            Lưu
                        </button>
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-600 hover:bg-gray-700 text-white text-xs rounded transition-colors"
                        >
                            <HiX className="w-3 h-3" />
                            Hủy
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Trạng thái:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                            systemInfo.status === 'Online' 
                                ? 'bg-green-500/20 text-green-300' 
                                : systemInfo.status === 'Offline'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                        }`}>
                            {systemInfo.status}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Phiên bản:</span>
                        <span className="text-blue-300 text-xs">{systemInfo.version}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemInfoEditor;
