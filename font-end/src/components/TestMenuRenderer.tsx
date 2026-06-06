import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from "react-router-dom";
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import '../assets/scss/Aside.scss';
import { userMenuItems, adminMenuItems } from "../constant/role-based-menu";
import { useAuth } from "../contexts/AuthContext";
import { StatisticsWidget } from './StatisticsWidget';

interface TestMenuRendererProps {
  className?: string;
}

const TestMenuRenderer: React.FC<TestMenuRendererProps> = ({ className = "" }) => {
    const location = useLocation();
    const pathname = location.pathname;
    const { user, isAdmin, hasPermission: checkPermission } = useAuth();
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    // Chọn menu dựa trên role
    const currentMenuItems = isAdmin ? [...userMenuItems, ...adminMenuItems] : userMenuItems;

    // Kiểm tra quyền hiển thị menu item
    const canShowMenuItem = (item: any) => {
        if (!item.permission) return true;
        const hasPerm = checkPermission(item.permission);
        console.log(`Permission check for ${item.label} (${item.permission}): ${hasPerm}`);
        return hasPerm;
    };

    // Toggle expanded state
    const toggleExpanded = (itemKey: string) => {
        setExpandedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(itemKey)) {
                newSet.delete(itemKey);
            } else {
                newSet.add(itemKey);
            }
            return newSet;
        });
    };

    return (
        <div className={`${className}`}>
            {/* User Info - Clean Design */}
            <div className="px-3 mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 text-xs">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                    <span className="text-cyan-400 font-medium">Thông tin người dùng</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Tên:</span>
                        <span className="text-white font-medium">{user?.name || 'Chưa đăng nhập'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Vai trò:</span>
                        <span className={`px-2 py-1 rounded text-xs font-medium ${isAdmin ? 'bg-red-500/20 text-red-300' : 'bg-green-500/20 text-green-300'}`}>
                            {isAdmin ? 'Admin' : 'User'}
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Permissions:</span>
                        <span className="text-yellow-300 text-xs">
                            {user?.permissions?.length || 0} quyền
                        </span>
                    </div>
                    {user?.permissions && user.permissions.length > 0 && (
                        <div className="mt-2">
                            <div className="text-gray-400 text-xs mb-1">Chi tiết:</div>
                            <div className="flex flex-wrap gap-1">
                                {user.permissions.map((perm, index) => (
                                    <span key={index} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                                        {perm}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* System Status - Clean Design */}
            <div className="px-3 mb-3 p-3 bg-gray-800/50 rounded-lg border border-gray-700/50 text-xs">
                <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span className="text-green-400 font-medium">Hệ thống</span>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Trạng thái:</span>
                        <span className="px-2 py-1 rounded text-xs bg-green-500/20 text-green-300 font-medium">
                            Online
                        </span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-gray-400">Phiên bản:</span>
                        <span className="text-cyan-300 font-medium">v1.0.0</span>
                    </div>
                </div>
            </div>

            {/* Quick Stats - Clean Design */}
            <StatisticsWidget className="px-3 mb-4" />

            {/* Main Menu Items */}
            {currentMenuItems.map((group, groupIndex) => (
                <div key={group.label} className="mb-4">
                    {/* Group Title */}
                    <div className="px-3 py-2 text-gray-500 text-xs font-medium uppercase tracking-wider border-b border-gray-700/30">
                        {group.label}
                    </div>

                    {/* Menu Items */}
                    <div className="px-3 mt-2">
                        {group.items.map((item, itemIndex) => {
                            // Kiểm tra permission trước khi hiển thị
                            const canShow = canShowMenuItem(item);
                            if (!canShow) return null;

                            const itemKey = `${groupIndex}-${itemIndex}`;
                            const isExpanded = expandedItems.has(itemKey);
                            const hasSubmenu = item.links && item.links.length > 0;
                            const isActive = item.active.some(activePath => 
                                pathname.startsWith(activePath)
                            );

                            return (
                                <div key={itemIndex} className="mb-1">
                                    {/* Main Menu Item */}
                                    <div 
                                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group
                                            ${isActive 
                                                ? 'bg-cyan-500/20 text-cyan-300 border-l-2 border-cyan-400' 
                                                : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                                            }`}
                                        onClick={() => hasSubmenu && toggleExpanded(itemKey)}
                                    >
                                        <div className={`transition-colors ${isActive ? 'text-cyan-300' : 'text-gray-400 group-hover:text-white'}`}>
                                            {item.icon}
                                        </div>
                                        <span className="text-sm font-medium flex-1">{item.label}</span>
                                        {hasSubmenu && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-gray-500 bg-gray-700/50 px-1.5 py-0.5 rounded">
                                                    {item.links.length}
                                                </span>
                                                <div className={`transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}>
                                                    <FaChevronRight className="text-xs text-gray-400" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Sub Menu Items - Only show if expanded */}
                                    {hasSubmenu && isExpanded && (
                                        <div className="ml-8 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                            {item.links.map((link, linkIndex) => {
                                                const isLinkActive = pathname === link.to;

                                                return (
                                                    <Link
                                                        key={linkIndex}
                                                        to={link.to}
                                                        className={`block px-3 py-2 rounded-md text-sm transition-all duration-200
                                                            ${isLinkActive
                                                                ? 'bg-cyan-500/10 text-cyan-300 border-l-2 border-cyan-400'
                                                                : 'text-gray-400 hover:text-white hover:bg-gray-700/30'
                                                            }`}
                                                    >
                                                        {link.title}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TestMenuRenderer;
