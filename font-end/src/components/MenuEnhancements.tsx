import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { FaBell, FaSearch, FaCog, FaMoon, FaSun, FaUser, FaSignOutAlt, FaChevronDown } from 'react-icons/fa';

// ==================== MENU SEARCH ====================
export const MenuSearch: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative px-3 mb-4">
      <div className="relative">
        <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Tìm kiếm menu..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 bg-gray-700 text-white rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-400"
        />
      </div>
      
      {/* Search Results Dropdown */}
      {searchTerm && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-2 text-xs text-gray-400">Kết quả tìm kiếm:</div>
          {/* Search results sẽ được implement */}
        </div>
      )}
    </div>
  );
};

// ==================== USER PROFILE MENU ====================
export const UserProfileMenu: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative px-3 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        <div className="flex items-center">
          <div className="w-8 h-8 bg-cyan-400 rounded-full flex items-center justify-center">
            <FaUser className="text-gray-800 text-sm" />
          </div>
          <div className="ml-3 text-left">
            <div className="text-sm font-medium text-white">{user?.name}</div>
            <div className="text-xs text-gray-400">
              {isAdmin ? 'Administrator' : 'User'}
            </div>
          </div>
        </div>
        <FaChevronDown className={`text-gray-400 text-xs transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg z-50">
          <div className="py-2">
            <a href="/profile" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              <FaUser className="mr-3" />
              Thông tin cá nhân
            </a>
            <a href="/profile/settings" className="flex items-center px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              <FaCog className="mr-3" />
              Cài đặt
            </a>
            <hr className="my-2 border-gray-600" />
            <button className="flex items-center w-full px-4 py-2 text-sm text-red-400 hover:bg-gray-700">
              <FaSignOutAlt className="mr-3" />
              Đăng xuất
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== NOTIFICATION BELL ====================
export const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState(3);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative px-3 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        <FaBell className="text-gray-300 text-sm" />
        {notifications > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
            {notifications}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-gray-800 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
          <div className="p-3 border-b border-gray-600">
            <h3 className="text-sm font-medium text-white">Thông báo</h3>
          </div>
          <div className="py-2">
            <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              <div className="font-medium">Upload thành công</div>
              <div className="text-xs text-gray-400">2 phút trước</div>
            </div>
            <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              <div className="font-medium">File đã được duyệt</div>
              <div className="text-xs text-gray-400">1 giờ trước</div>
            </div>
            <div className="px-4 py-2 text-sm text-gray-300 hover:bg-gray-700">
              <div className="font-medium">Hệ thống bảo trì</div>
              <div className="text-xs text-gray-400">3 giờ trước</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== THEME TOGGLE ====================
export const ThemeToggle: React.FC = () => {
  const [isDark, setIsDark] = useState(true);

  const toggleTheme = () => {
    setIsDark(!isDark);
    // Implement theme switching logic
  };

  return (
    <div className="px-3 mb-4">
      <button
        onClick={toggleTheme}
        className="w-full flex items-center justify-center p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
      >
        {isDark ? (
          <FaSun className="text-yellow-400 text-sm" />
        ) : (
          <FaMoon className="text-gray-300 text-sm" />
        )}
        <span className="ml-2 text-sm text-gray-300">
          {isDark ? 'Light Mode' : 'Dark Mode'}
        </span>
      </button>
    </div>
  );
};

// ==================== QUICK ACTIONS ====================
export const QuickActions: React.FC = () => {
  const { isAdmin } = useAuth();

  const quickActions = [
    { label: 'Upload mới', icon: '📤', path: '/resources/upload' },
    { label: 'Tìm kiếm', icon: '🔍', path: '/search' },
    { label: 'Báo cáo', icon: '📊', path: isAdmin ? '/admin/reports' : '/dashboard' },
    { label: 'Cài đặt', icon: '⚙️', path: '/profile/settings' }
  ];

  return (
    <div className="px-3 mb-4">
      <div className="text-xs text-gray-400 mb-2 font-medium">QUICK ACTIONS</div>
      <div className="grid grid-cols-2 gap-2">
        {quickActions.map((action, index) => (
          <a
            key={index}
            href={action.path}
            className="flex flex-col items-center p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors text-center"
          >
            <span className="text-lg mb-1">{action.icon}</span>
            <span className="text-xs text-gray-300">{action.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

// ==================== MENU STATS ====================
export const MenuStats: React.FC = () => {
  const [stats, setStats] = useState({
    totalResources: 0,
    downloads: 0,
    uploads: 0
  });

  useEffect(() => {
    // Fetch stats from API
    setStats({
      totalResources: 1247,
      downloads: 5892,
      uploads: 23
    });
  }, []);

  return (
    <div className="px-3 mb-4">
      <div className="text-xs text-gray-400 mb-2 font-medium">THỐNG KÊ</div>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Tài nguyên:</span>
          <span className="text-cyan-400 font-medium">{stats.totalResources.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Tải xuống:</span>
          <span className="text-green-400 font-medium">{stats.downloads.toLocaleString()}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Upload hôm nay:</span>
          <span className="text-yellow-400 font-medium">{stats.uploads}</span>
        </div>
      </div>
    </div>
  );
};

// ==================== RECENT ACTIVITY ====================
export const RecentActivity: React.FC = () => {
  const activities = [
    { action: 'Uploaded', file: 'app-v2.1.apk', time: '2 phút trước' },
    { action: 'Downloaded', file: 'game-setup.exe', time: '15 phút trước' },
    { action: 'Shared', file: 'document.pdf', time: '1 giờ trước' }
  ];

  return (
    <div className="px-3 mb-4">
      <div className="text-xs text-gray-400 mb-2 font-medium">HOẠT ĐỘNG GẦN ĐÂY</div>
      <div className="space-y-2">
        {activities.map((activity, index) => (
          <div key={index} className="text-xs text-gray-300">
            <div className="font-medium">{activity.action} {activity.file}</div>
            <div className="text-gray-500">{activity.time}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
