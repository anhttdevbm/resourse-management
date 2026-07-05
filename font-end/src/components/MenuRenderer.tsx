import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Link } from "react-router-dom";
import { FaSignOutAlt } from 'react-icons/fa';
import { HiOutlineChevronDown } from 'react-icons/hi2';
import '../assets/scss/Aside.scss';
import { userMenuItems, adminMenuItems } from "../constant/role-based-menu";
import { useAuth } from "../contexts/AuthContext";
import { logout } from "../services/AuthService";
import { useDispatch, useSelector } from "react-redux";
import { setAuthLogout } from "../redux/slice/authSlice";
import { RootState } from "../redux/store";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { cookieStorage } from "../utils/cookie";
import { getApiOrigin } from "../configs/axios";
import { useI18n } from "../i18n/I18nProvider";

interface MenuRendererProps {
  className?: string;
}

const MenuRenderer: React.FC<MenuRendererProps> = ({ className = "" }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const pathname = location.pathname;
    const { user, isAdmin, hasPermission: checkPermission } = useAuth();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
    const { t } = useI18n();

    const tr = (value: string): string => {
        // Convention: string like "i18n:menu.xxx" => translate by key
        if (typeof value === "string" && value.startsWith("i18n:")) {
            return t(value.slice("i18n:".length) as any);
        }
        return value;
    };

    // Chọn menu dựa trên role
    const currentMenuItems = isAdmin ? [...userMenuItems, ...adminMenuItems] : userMenuItems;

    // Kiểm tra quyền hiển thị menu item
    const canShowMenuItem = (item: any) => {
        if (!item.permission) return true;
        const hasPerm = checkPermission(item.permission);
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

    // Logout function
    const handleLogout = async () => {
        try {
            await logout();
            dispatch(setAuthLogout());
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    // Helper function to build avatar URL
    const getAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
        if (!avatarUrl) return undefined;
        if (avatarUrl.startsWith('http')) {
            return `${avatarUrl}?t=${Date.now()}`;
        }
        const token = cookieStorage.getItem("accessToken");
        const apiUrl = getApiOrigin();
        return token 
            ? `${apiUrl}/resource-management/users/me/avatar?token=${encodeURIComponent(token)}&t=${Date.now()}`
            : undefined;
    };

    const userInitials = currentUser?.name
        ? currentUser.name
              .split(" ")
              .map((n) => n[0])
              .join("")
              .toUpperCase()
              .slice(0, 2)
        : "U";

    return (
        <div className={`${className} px-4 py-6 h-full min-h-0 flex flex-col`}>
            {/* Scrollable content (profile + menus) */}
            <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar pr-1 pb-4">
                {/* User Profile Card */}
                <div className="mb-6 p-4 bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-xl border border-slate-700/50 shadow-lg backdrop-blur-sm">
                    <div className="flex items-center gap-3 mb-3">
                        <Avatar className="w-12 h-12 border-2 border-blue-500/50 shadow-md">
                            <AvatarImage src={getAvatarUrl(currentUser?.avatar_url)} />
                            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                                {userInitials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="text-white font-semibold text-sm truncate">
                                {currentUser?.name || user?.name || tr("i18n:menu.user.defaultName")}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    isAdmin 
                                        ? 'bg-red-500/20 text-red-300 border border-red-500/30' 
                                        : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                }`}>
                                    {isAdmin ? 'Admin' : 'User'}
                                </span>
                            </div>
                        </div>
                    </div>
                    <Link 
                        to="/profile/edit"
                        className="block w-full mt-3 px-3 py-2 text-center text-xs font-medium text-slate-300 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors border border-slate-600/50"
                    >
                        {tr("i18n:menu.user.editProfile")}
                    </Link>
                </div>

                {/* Main Menu Items */}
                {currentMenuItems.map((group, groupIndex) => (
                    <div key={group.label} className="mb-6">
                        {/* Group Title */}
                        <div className="px-2 mb-3">
                            <div className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest">
                                {tr(group.label)}
                            </div>
                        </div>

                        {/* Menu Items */}
                        <div className="space-y-1">
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
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group relative
                                                ${isActive 
                                                    ? 'bg-gradient-to-r from-blue-600/20 to-purple-600/20 text-white shadow-lg shadow-blue-500/10' 
                                                    : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                                                }`}
                                            onClick={() => hasSubmenu && toggleExpanded(itemKey)}
                                        >
                                            {/* Active indicator */}
                                            {isActive && (
                                                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-purple-500 rounded-r-full"></div>
                                            )}
                                            
                                            <div className={`flex-shrink-0 transition-all duration-200 ${
                                                isActive 
                                                    ? 'text-blue-400 scale-110' 
                                                    : 'text-slate-400 group-hover:text-blue-400 group-hover:scale-110'
                                            }`}>
                                                {item.icon}
                                            </div>
                                            <span className="text-sm font-medium flex-1">{tr(item.label)}</span>
                                            {hasSubmenu && (
                                                <div className={`flex items-center transition-transform duration-200 ${
                                                    isExpanded ? 'rotate-90' : ''
                                                }`}>
                                                    <HiOutlineChevronDown className={`text-xs ${
                                                        isActive ? 'text-blue-400' : 'text-slate-500'
                                                    }`} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Sub Menu Items - Only show if expanded */}
                                        {hasSubmenu && isExpanded && (
                                            <div className="ml-4 mt-1 space-y-0.5 pl-4 border-l-2 border-slate-700/50 animate-in slide-in-from-top-2 duration-200">
                                                {item.links.map((link, linkIndex) => {
                                                    const isLinkActive = pathname === link.to;

                                                    return (
                                                        <Link
                                                            key={linkIndex}
                                                            to={link.to}
                                                            className={`block px-3 py-2 rounded-md text-sm transition-all duration-200 relative
                                                                ${isLinkActive
                                                                    ? 'text-blue-400 bg-blue-500/10 font-medium'
                                                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                                                                }`}
                                                        >
                                                            {isLinkActive && (
                                                                <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-blue-500 rounded-r-full"></div>
                                                            )}
                                                            <span className="pl-1">{tr(link.title)}</span>
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

            {/* Logout Button pinned bottom */}
            <div className="pt-5 border-t border-slate-700/50 flex-none sticky bottom-0 bg-slate-900/95 backdrop-blur shadow-[0_-4px_12px_-6px_rgba(0,0,0,0.4)]">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200 text-sm font-medium border border-red-500/20 hover:border-red-500/40 hover:shadow-lg hover:shadow-red-500/10"
                >
                    <FaSignOutAlt className="w-4 h-4" />
                    <span>{tr("i18n:menu.actions.logout")}</span>
                </button>
            </div>
        </div>
    );
};

export default MenuRenderer;