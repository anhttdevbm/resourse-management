import React, { createContext, useContext } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';
import { User } from '../types/User';
import { userHasAdminAccess } from '../utils/isAdminUser';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  hasPermission: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  const isAdmin = userHasAdminAccess(user);
  
  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions?.includes(permission) || isAdmin;
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isAdmin,
      hasPermission
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 