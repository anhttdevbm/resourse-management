import React from 'react';
import { useAuth } from '../contexts/AuthContext';

export const MenuShortcutsHelp: React.FC = () => {
  const { isAdmin } = useAuth();

  const shortcuts = [
    { key: 'Ctrl+D', action: 'Dashboard' },
    { key: 'Ctrl+R', action: 'Resources' },
    { key: 'Ctrl+U', action: 'Upload' },
    { key: 'Ctrl+S', action: 'Search' },
    { key: 'Ctrl+P', action: 'Profile' },
    ...(isAdmin ? [
      { key: 'Ctrl+A', action: 'Admin Users' },
      { key: 'Ctrl+H', action: 'System Health' },
      { key: 'Ctrl+L', action: 'System Logs' }
    ] : [])
  ];

  return (
    <div className="px-3 mb-4">
      <div className="text-xs text-gray-400 mb-2 font-medium">KEYBOARD SHORTCUTS</div>
      <div className="space-y-1">
        {shortcuts.map((shortcut, index) => (
          <div key={index} className="flex justify-between items-center text-xs">
            <span className="text-gray-400">{shortcut.action}:</span>
            <kbd className="px-1 py-0.5 bg-gray-700 text-gray-300 rounded text-xs">
              {shortcut.key}
            </kbd>
          </div>
        ))}
      </div>
    </div>
  );
};
