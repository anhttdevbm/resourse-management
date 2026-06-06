import React from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from "react-router-dom";
import { FaUser, FaBell, FaSearch, FaCog, FaChartBar } from 'react-icons/fa';
import '../assets/scss/Aside.scss';
import { userMenuItems, adminMenuItems } from "../constant/role-based-menu";
import { useAuth } from "../contexts/AuthContext";

interface BalancedMenuRendererProps {
  className?: string;
}

const BalancedMenuRenderer: React.FC<BalancedMenuRendererProps> = ({ className = "" }) => {
    const location = useLocation();
    const pathname = location.pathname;
    const { user, isAdmin, hasPermission: checkPermission } = useAuth();

    // Chọn menu dựa trên role
    const currentMenuItems = isAdmin ? [...userMenuItems, ...adminMenuItems] : userMenuItems;

    // Kiểm tra quyền hiển thị menu item
    const canShowMenuItem = (item: any) => {
        if (!item.permission) return true;
        return checkPermission(item.permission);
    };

    return (
        <div className={`${className}`}>
            {/* User Info & Quick Actions */}
            <div className="px-3 mb-4">
                {/* User Profile */}
                <div className="flex items-center gap-3 p-3 bg-gray-700 rounded-lg mb-3">
                    <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center">
                        <FaUser className="text-gray-800 text-sm" />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-medium text-white">{user?.name}</div>
                        <div className="text-xs text-gray-400">
                            {isAdmin ? 'Administrator' : 'User'}
                        </div>
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                    <div className="bg-gray-700 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-400">Resources</div>
                        <div className="text-sm font-medium text-cyan-400">1,247</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-400">Downloads</div>
                        <div className="text-sm font-medium text-green-400">5,892</div>
                    </div>
                    <div className="bg-gray-700 rounded-lg p-2 text-center">
                        <div className="text-xs text-gray-400">Today</div>
                        <div className="text-sm font-medium text-yellow-400">23</div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="flex gap-2">
                    <button className="flex-1 flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg py-2 px-3 text-xs transition-colors">
                        <FaSearch className="text-xs" />
                        Search
                    </button>
                    <button className="flex-1 flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg py-2 px-3 text-xs transition-colors">
                        <FaBell className="text-xs" />
                        <span className="bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
                    </button>
                </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-600 mx-3 my-4"></div>

            {/* Main Menu Items */}
            {currentMenuItems.map((group, groupIndex) => (
                <div key={group.label} className="mb-6">
                    {/* Group Title */}
                    <div className="px-6 py-2 text-gray-400 text-xs font-semibold uppercase tracking-wider">
                        {group.label}
                    </div>

                    {/* Menu Items */}
                    <div className="px-3">
                        {group.items.map((item, itemIndex) => {
                            if (!canShowMenuItem(item)) return null;

                            const isActive = item.active.some(activePath => 
                                pathname.startsWith(activePath)
                            );

                            return (
                                <div key={itemIndex} className="mb-2">
                                    {/* Main Menu Item */}
                                    <div className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer
                                        ${isActive 
                                            ? 'bg-[#1e2a5a] text-white' 
                                            : 'text-gray-300 hover:bg-[#1e2a5a] hover:text-white'
                                        }`}>
                                        {item.icon}
                                        <span className="text-sm font-medium">{item.label}</span>
                                        {item.links.length > 0 && (
                                            <span className="ml-auto text-xs text-gray-400">
                                                {item.links.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Sub Menu Items - Always show if has links */}
                                    {item.links && item.links.length > 0 && (
                                        <div className="ml-6 mt-2 space-y-1">
                                            {item.links.map((link, linkIndex) => {
                                                const isLinkActive = pathname === link.to;

                                                return (
                                                    <Link
                                                        key={linkIndex}
                                                        to={link.to}
                                                        className={`block px-3 py-2 rounded-lg text-sm transition-colors
                                                            ${isLinkActive
                                                                ? 'bg-[#1e2a5a] text-white font-medium'
                                                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
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

            {/* Footer Actions */}
            <div className="px-3 mt-6">
                <div className="border-t border-gray-600 pt-4">
                    <div className="flex gap-2">
                        <Link
                            to="/profile/settings"
                            className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg py-2 px-3 text-xs transition-colors"
                        >
                            <FaCog className="text-xs" />
                            Settings
                        </Link>
                        {isAdmin && (
                            <Link
                                to="/admin/reports"
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 px-3 text-xs transition-colors"
                            >
                                <FaChartBar className="text-xs" />
                                Reports
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BalancedMenuRenderer;
