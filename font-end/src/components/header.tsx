import {HiOutlineBars3CenterLeft, HiOutlineCog6Tooth, HiOutlineUser, HiOutlineKey } from "react-icons/hi2";
import {IoIosSearch} from "react-icons/io";
import { useNavigate} from "react-router-dom";
import {IoExitOutline} from "react-icons/io5";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "../components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { logout } from "../services/AuthService";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setAuthLogout } from "../redux/slice/authSlice";
import { useState, useEffect } from "react";
import SearchModal from "./SearchModal";
import NotificationBell from "./NotificationBell";
import { cookieStorage } from "../utils/cookie";
import { useI18n } from "../i18n/I18nProvider";

interface HeaderProps {
    onToggleSidebar: () => void;
    isSidebarOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, isSidebarOpen }) => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { t } = useI18n();
    const { user: currentUser } = useSelector((state: RootState) => state.auth);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [avatarKey, setAvatarKey] = useState(0); // Force re-render avatar
    
    // Helper function to build avatar URL
    const getAvatarUrl = (avatarUrl: string | null | undefined): string | undefined => {
        if (!avatarUrl) return undefined;
        if (avatarUrl.startsWith('http')) {
            return `${avatarUrl}?t=${Date.now()}`; // Cache busting
        }
        const token = cookieStorage.getItem("accessToken");
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:30111';
        return token 
            ? `${apiUrl}/resource-management/users/me/avatar?token=${encodeURIComponent(token)}&t=${Date.now()}`
            : undefined;
    };
    
    // Listen for auth state changes to force avatar re-render
    useEffect(() => {
        // Force re-render avatar whenever user changes
        setAvatarKey(prev => prev + 1);
    }, [currentUser?.id, currentUser?.avatar_url]); // Trigger on user ID or avatar_url change

    // Keyboard shortcut: Ctrl+K or Cmd+K to open search
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
            if (e.key === 'Escape' && isSearchOpen) {
                setIsSearchOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isSearchOpen]);

    const handleLogout = async () => {
        try {
            await logout();
            dispatch(setAuthLogout());
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
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
        <header className={`app-header h-16 fixed top-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-gray-200/50 dark:border-slate-700/60 shadow-sm z-40 transition-all duration-300 ${
            isSidebarOpen ? 'left-64 right-0' : 'left-0 right-0'
        }`}>
            <div className="h-full flex items-center justify-between px-6">
                {/* Left side - Hamburger menu */}
                <div className="flex items-center gap-3">
                    <button
                        onClick={onToggleSidebar}
                        className="relative p-2.5 rounded-xl hover:bg-gradient-to-br hover:from-gray-50 hover:to-gray-100 transition-all duration-200 group active:scale-95"
                        aria-label="Toggle sidebar"
                    >
                        <div className="relative w-5 h-5 flex flex-col justify-center gap-1.5">
                            <span className={`block h-0.5 w-full bg-gray-700 rounded-full transition-all duration-300 ${
                                isSidebarOpen ? 'rotate-45 translate-y-2' : 'group-hover:bg-gray-900'
                            }`}></span>
                            <span className={`block h-0.5 w-full bg-gray-700 rounded-full transition-all duration-300 ${
                                isSidebarOpen ? 'opacity-0' : 'group-hover:bg-gray-900'
                            }`}></span>
                            <span className={`block h-0.5 w-full bg-gray-700 rounded-full transition-all duration-300 ${
                                isSidebarOpen ? '-rotate-45 -translate-y-2' : 'group-hover:bg-gray-900'
                            }`}></span>
                        </div>
                    </button>
                    
                    {/* Divider */}
                    <div className="h-8 w-px bg-gradient-to-b from-transparent via-gray-300 to-transparent"></div>
                </div>
                
                {/* Right side - Actions and profile */}
                <div className="flex items-center gap-2">
                    {/* Search Button */}
                    <button
                        onClick={() => setIsSearchOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 hover:border-gray-300 transition-all duration-200 group"
                        title={t("header.searchTooltip")}
                    >
                        <IoIosSearch className="text-lg text-gray-500 group-hover:text-gray-700 transition-colors" />
                        <span className="text-sm text-gray-500 group-hover:text-gray-700 hidden md:inline">{t("menu.item.search")}</span>
                        <kbd className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-semibold text-gray-500 bg-white border border-gray-200 rounded">
                            <span className="text-[10px]">⌘</span>K
                        </kbd>
                    </button>
                    
                    {/* Search Modal */}
                    <SearchModal 
                        isOpen={isSearchOpen} 
                        onClose={() => setIsSearchOpen(false)} 
                    />
                    
                    {/* Notifications */}
                    <div className="relative">
                        <NotificationBell />
                    </div>
                    
                    {/* Settings */}
                    <button
                        className="p-2 rounded-lg hover:bg-gray-100 transition-colors group relative"
                        title={t("header.settingsTooltip")}
                    >
                        <HiOutlineCog6Tooth className="text-xl text-gray-600 group-hover:text-gray-900 group-hover:rotate-90 transition-all duration-300" />
                    </button>
                    
                    {/* Divider */}
                    <div className="h-8 w-px bg-gray-300 mx-1"></div>
                    
                    {/* Profile Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger className="flex items-center gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                            <Avatar className="w-9 h-9 border-2 border-gray-200 shadow-sm" key={avatarKey}>
                                <AvatarImage 
                                    src={getAvatarUrl(currentUser?.avatar_url)}
                                />
                                <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold text-sm">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="text-left hidden md:block">
                                <div className="font-semibold text-sm text-gray-900 leading-tight">
                                    {currentUser?.name || t("menu.user.defaultName")}
                                </div>
                                <div className="text-xs text-gray-500 leading-tight">
                                    {currentUser?.email || "user@example.com"}
                                </div>
                            </div>
                            <HiOutlineBars3CenterLeft className="text-gray-400 hidden lg:block ml-1" />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent 
                            align="end" 
                            className="w-56 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg p-1"
                        >
                            <DropdownMenuLabel className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {t("header.accountLabel")}
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="my-1" />
                            
                            <DropdownMenuItem 
                                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-gray-700"
                                onClick={() => navigate('/profile/edit')}
                            >
                                <div className="p-1.5 rounded-md bg-blue-50">
                                    <HiOutlineUser className="w-4 h-4 text-blue-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{t("menu.item.profile")}</span>
                                    <span className="text-xs text-gray-500">{t("header.profileSubtitle")}</span>
                                </div>
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem 
                                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-gray-50 transition-colors text-gray-700"
                                onClick={() => navigate('/profile/password')}
                            >
                                <div className="p-1.5 rounded-md bg-green-50">
                                    <HiOutlineKey className="w-4 h-4 text-green-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{t("menu.link.changePassword")}</span>
                                    <span className="text-xs text-gray-500">{t("header.passwordSubtitle")}</span>
                                </div>
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator className="my-1" />
                            
                            <DropdownMenuItem 
                                className="flex items-center gap-3 px-3 py-2.5 rounded-md cursor-pointer hover:bg-red-50 transition-colors text-red-600"
                                onClick={handleLogout}
                            >
                                <div className="p-1.5 rounded-md bg-red-50">
                                    <IoExitOutline className="w-4 h-4 text-red-600" />
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-medium">{t("menu.actions.logout")}</span>
                                    <span className="text-xs text-red-500">{t("header.logoutSubtitle")}</span>
                                </div>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
export default Header;