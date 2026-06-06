import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cookieStorage } from '../utils/cookie';

interface MenuAnalytics {
  mostUsedMenus: Array<{
    path: string;
    title: string;
    count: number;
  }>;
  recentMenus: Array<{
    path: string;
    title: string;
    timestamp: number;
  }>;
  totalClicks: number;
}

export const useMenuAnalytics = () => {
  const location = useLocation();
  const [analytics, setAnalytics] = useState<MenuAnalytics>({
    mostUsedMenus: [],
    recentMenus: [],
    totalClicks: 0
  });

  useEffect(() => {
    // Track menu usage
    const trackMenuUsage = (path: string, title: string) => {
      const currentAnalytics = JSON.parse(cookieStorage.getItem('menuAnalytics') || '{}');
      
      // Update most used menus
      const mostUsed = currentAnalytics.mostUsedMenus || [];
      const existingIndex = mostUsed.findIndex((item: any) => item.path === path);
      
      if (existingIndex >= 0) {
        mostUsed[existingIndex].count += 1;
      } else {
        mostUsed.push({ path, title, count: 1 });
      }
      
      // Sort by count and keep top 5
      mostUsed.sort((a: any, b: any) => b.count - a.count);
      const topMostUsed = mostUsed.slice(0, 5);
      
      // Update recent menus
      const recent = currentAnalytics.recentMenus || [];
      recent.unshift({ path, title, timestamp: Date.now() });
      
      // Keep only last 10 recent menus
      const topRecent = recent.slice(0, 10);
      
      // Update total clicks
      const totalClicks = (currentAnalytics.totalClicks || 0) + 1;
      
      const newAnalytics = {
        mostUsedMenus: topMostUsed,
        recentMenus: topRecent,
        totalClicks
      };
      
      cookieStorage.setItem('menuAnalytics', JSON.stringify(newAnalytics), { expires: 30 });
      setAnalytics(newAnalytics);
    };

    // Track current page visit
    const currentPath = location.pathname;
    const currentTitle = document.title;
    
    if (currentPath !== '/login' && currentPath !== '/forgot-password') {
      trackMenuUsage(currentPath, currentTitle);
    }
  }, [location]);

  return analytics;
};

