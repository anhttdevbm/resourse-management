import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight, FaBars } from 'react-icons/fa';

interface MenuCollapseProps {
  children: React.ReactNode;
}

export const MenuCollapse: React.FC<MenuCollapseProps> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className={`relative transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-60'}`}>
      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className={`absolute top-4 z-50 bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2 transition-all duration-300 ${
          isCollapsed ? 'right-2' : 'right-2'
        }`}
      >
        {isCollapsed ? <FaChevronRight className="w-3 h-3" /> : <FaChevronLeft className="w-3 h-3" />}
      </button>

      {/* Mobile Menu Toggle */}
      {isMobile && (
        <button
          onClick={toggleCollapse}
          className="fixed top-4 left-4 z-50 bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-2 lg:hidden"
        >
          <FaBars className="w-4 h-4" />
        </button>
      )}

      {/* Menu Content */}
      <div className={`h-screen bg-[#111c43] transition-all duration-300 ${
        isCollapsed ? 'w-16' : 'w-60'
      } ${isMobile && !isCollapsed ? 'fixed left-0 top-0 z-40' : ''}`}>
        {children}
      </div>

      {/* Mobile Overlay */}
      {isMobile && !isCollapsed && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsCollapsed(true)}
        />
      )}
    </div>
  );
};

// Collapsed Menu Icons
export const CollapsedMenuIcons: React.FC = () => {
  // const { isAdmin } = useAuth();
  
  const iconMenus = [
    { icon: '🏠', path: '/dashboard', title: 'Dashboard' },
    { icon: '📁', path: '/resources', title: 'Resources' },
    { icon: '🔍', path: '/search', title: 'Search' },
    { icon: '👤', path: '/profile', title: 'Profile' },
    { icon: '⚙️', path: '/admin', title: 'Admin' }
  ];

  return (
    <div className="flex flex-col items-center py-4 space-y-4">
      {iconMenus.map((menu, index) => (
        <a
          key={index}
          href={menu.path}
          className="w-10 h-10 flex items-center justify-center bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors group relative"
          title={menu.title}
        >
          <span className="text-lg">{menu.icon}</span>
          
          {/* Tooltip */}
          <div className="absolute left-full ml-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-50">
            {menu.title}
          </div>
        </a>
      ))}
    </div>
  );
};
