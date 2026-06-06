import React from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from "react-router-dom";
import '../assets/scss/Aside.scss';
import { userMenuItems, adminMenuItems } from "../constant/role-based-menu";
import { useAuth } from "../contexts/AuthContext";

interface CleanMenuRendererProps {
  className?: string;
}

const CleanMenuRenderer: React.FC<CleanMenuRendererProps> = ({ className = "" }) => {
    const location = useLocation();
    const pathname = location.pathname;
    const { isAdmin, hasPermission: checkPermission } = useAuth();

    // Chọn menu dựa trên role
    const currentMenuItems = isAdmin ? [...userMenuItems, ...adminMenuItems] : userMenuItems;

    // Kiểm tra quyền hiển thị menu item
    const canShowMenuItem = (item: any) => {
        if (!item.permission) return true;
        return checkPermission(item.permission);
    };

    return (
        <div className={`${className}`}>
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
                                    </div>

                                    {/* Sub Menu Items - Only show if main item is active */}
                                    {isActive && (
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
        </div>
    );
};

export default CleanMenuRenderer;
