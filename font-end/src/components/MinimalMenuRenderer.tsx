import React from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from "react-router-dom";
import '../assets/scss/Aside.scss';
import { userMenuItems, adminMenuItems } from "../constant/role-based-menu";
import { useAuth } from "../contexts/AuthContext";

interface MinimalMenuRendererProps {
  className?: string;
}

const MinimalMenuRenderer: React.FC<MinimalMenuRendererProps> = ({ className = "" }) => {
    const location = useLocation();
    const pathname = location.pathname;
    const { isAdmin, hasPermission: checkPermission } = useAuth();

    // Chọn menu dựa trên role
    const currentMenuItems = isAdmin ? [...userMenuItems, ...adminMenuItems] : userMenuItems;

    // Kiểm tra quyền hiển thị menu item
    const canShowMenuItem = (item: any) => {
        if (!item.permission) return true; // Menu không cần permission
        return checkPermission(item.permission);
    };

    return (
        <div className={`${className}`}>
            {/* Main Menu Items */}
            {currentMenuItems.map((group, groupIndex) => (
                <div key={group.label}>
                    <div className="menu-category px-6 py-2 text-gray-400 text-xs tracking-wider font-semibold mt-2 uppercase opacity-50">
                        {group.label}
                    </div>

                    <div className="px-3">
                        {group.items.map((item, itemIndex) => {
                            // Chỉ hiển thị menu item nếu user có quyền
                            if (!canShowMenuItem(item)) return null;

                            const isActive = item.active.some(activePath => 
                                pathname.startsWith(activePath)
                            );

                            return (
                                <div key={itemIndex} className="mb-1">
                                    {/* Main Menu Item */}
                                    <div className={`rounded-lg px-3 py-2 transition-all duration-200 flex items-center
                                        text-gray-300 hover:bg-[#1e2a5a] hover:text-white ${isActive ? 'bg-[#1e2a5a] text-white' : ''}`}>
                                        <div className="flex items-center gap-2">
                                            {item.icon}
                                            <span>{item.label}</span>
                                        </div>
                                    </div>

                                    {/* Sub Menu Items */}
                                    <div className="ml-6 mt-1 space-y-1">
                                        {item.links.map((link, linkIndex) => {
                                            const isLinkActive = pathname === link.to;

                                            return (
                                                <Link
                                                    key={linkIndex}
                                                    to={link.to}
                                                    className={`block rounded-lg py-1.5 px-3 transition-all duration-200 no-underline w-full text-sm
                                                        ${isLinkActive
                                                            ? 'bg-[#1e2a5a] text-white font-medium'
                                                            : 'text-gray-400 hover:text-white hover:bg-[#1e2a5a]'}
                                                    `}
                                                >
                                                    {link.title}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default MinimalMenuRenderer;
