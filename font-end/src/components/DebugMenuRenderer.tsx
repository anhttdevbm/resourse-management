import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Link } from "react-router-dom";
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import '../assets/scss/Aside.scss';
import { userMenuItems, adminMenuItems } from "../constant/role-based-menu";
import { useAuth } from "../contexts/AuthContext";

interface DebugMenuRendererProps {
  className?: string;
}

const DebugMenuRenderer: React.FC<DebugMenuRendererProps> = ({ className = "" }) => {
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
        console.log(`Permission check for ${item.label}: ${item.permission} = ${hasPerm}`);
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
            {/* Debug Info */}
            <div className="px-3 mb-4 p-2 bg-gray-800 rounded text-xs">
                <div className="text-cyan-400">Debug Info:</div>
                <div className="text-white">User: {user?.name || 'Unknown'}</div>
                <div className="text-white">Admin: {isAdmin ? 'Yes' : 'No'}</div>
                <div className="text-white">Permissions: {user?.permissions?.join(', ') || 'None'}</div>
            </div>

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
                            const canShow = canShowMenuItem(item);
                            console.log(`Menu item ${item.label}: canShow = ${canShow}`);
                            
                            if (!canShow) return null;

                            const isActive = item.active.some(activePath => 
                                pathname.startsWith(activePath)
                            );

                            const itemKey = `${groupIndex}-${itemIndex}`;
                            const isExpanded = expandedItems.has(itemKey);
                            const hasSubmenu = item.links && item.links.length > 0;

                            return (
                                <div key={itemIndex} className="mb-2">
                                    {/* Main Menu Item */}
                                    <div 
                                        className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors cursor-pointer
                                            ${isActive 
                                                ? 'bg-[#1e2a5a] text-white' 
                                                : 'text-gray-300 hover:bg-[#1e2a5a] hover:text-white'
                                            }`}
                                        onClick={() => hasSubmenu && toggleExpanded(itemKey)}
                                    >
                                        {item.icon}
                                        <span className="text-sm font-medium">{item.label}</span>
                                        {hasSubmenu && (
                                            <span className="ml-auto flex items-center gap-2">
                                                <span className="text-xs text-gray-400">
                                                    {item.links.length}
                                                </span>
                                                {isExpanded ? (
                                                    <FaChevronDown className="text-xs text-gray-400" />
                                                ) : (
                                                    <FaChevronRight className="text-xs text-gray-400" />
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    {/* Sub Menu Items - Only show if expanded */}
                                    {hasSubmenu && isExpanded && (
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

export default DebugMenuRenderer;
