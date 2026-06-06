import React from 'react';
import { useMenuAnalytics } from '../hooks/useMenuAnalytics';

// Most Used Menus Component
export const MostUsedMenus: React.FC = () => {
  const { mostUsedMenus } = useMenuAnalytics();

  if (mostUsedMenus.length === 0) return null;

  return (
    <div className="px-3 mb-4">
      <div className="text-xs text-gray-400 mb-2 font-medium">MENU THƯỜNG DÙNG</div>
      <div className="space-y-1">
        {mostUsedMenus.map((menu, index) => (
          <a
            key={index}
            href={menu.path}
            className="flex justify-between items-center text-xs text-gray-300 hover:text-white hover:bg-gray-700 rounded px-2 py-1"
          >
            <span className="truncate">{menu.title}</span>
            <span className="text-gray-500 ml-2">{menu.count}</span>
          </a>
        ))}
      </div>
    </div>
  );
};

// Menu Usage Stats Component
export const MenuUsageStats: React.FC = () => {
  const { totalClicks, mostUsedMenus } = useMenuAnalytics();

  return (
    <div className="px-3 mb-4">
      <div className="text-xs text-gray-400 mb-2 font-medium">THỐNG KÊ SỬ DỤNG</div>
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Tổng lượt click:</span>
          <span className="text-cyan-400 font-medium">{totalClicks}</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Menu yêu thích:</span>
          <span className="text-green-400 font-medium">
            {mostUsedMenus.length > 0 ? mostUsedMenus[0].title : 'Chưa có'}
          </span>
        </div>
      </div>
    </div>
  );
};
