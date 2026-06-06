import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const useMenuShortcuts = () => {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Chỉ xử lý khi không đang nhập text
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Ctrl/Cmd + Key combinations
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'd':
            event.preventDefault();
            navigate('/dashboard');
            break;
          case 'r':
            event.preventDefault();
            navigate('/resources');
            break;
          case 'u':
            event.preventDefault();
            navigate('/resources/upload');
            break;
          case 's':
            event.preventDefault();
            navigate('/search');
            break;
          case 'p':
            event.preventDefault();
            navigate('/profile');
            break;
          case 'a':
            if (isAdmin) {
              event.preventDefault();
              navigate('/admin/users');
            }
            break;
          case 'h':
            if (isAdmin) {
              event.preventDefault();
              navigate('/admin/health');
            }
            break;
          case 'l':
            if (isAdmin) {
              event.preventDefault();
              navigate('/admin/logs');
            }
            break;
        }
      }

      // Alt + Key combinations
      if (event.altKey) {
        switch (event.key.toLowerCase()) {
          case '1':
            event.preventDefault();
            navigate('/dashboard');
            break;
          case '2':
            event.preventDefault();
            navigate('/resources');
            break;
          case '3':
            event.preventDefault();
            navigate('/search');
            break;
          case '4':
            event.preventDefault();
            navigate('/profile');
            break;
          case '5':
            if (isAdmin) {
              event.preventDefault();
              navigate('/admin');
            }
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate, isAdmin]);
};

