import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

export interface UserAuth {
  token: string;
  userId?: number;
  username: string;
  fullName: string;
  role: string; // 'ADMIN' | 'PHARMACIST' | 'CUSTOMER'
}

interface AuthContextType {
  user: UserAuth | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<UserAuth>;
  logout: () => void;
  hasRole: (roles: string | string[]) => boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserAuth | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Khởi tạo từ LocalStorage khi nạp trang
    try {
      const storedToken = localStorage.getItem('nhathuoc_token');
      const storedUser = localStorage.getItem('nhathuoc_user');
      if (storedToken && storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (e) {
      console.error('Lỗi khi nạp thông tin xác thực từ localStorage:', e);
      localStorage.removeItem('nhathuoc_token');
      localStorage.removeItem('nhathuoc_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (username: string, password: string): Promise<UserAuth> => {
    // Thử gọi endpoint chuẩn /v1/auth/login
    let response;
    try {
      response = await api.post('/v1/auth/login', { username, password });
    } catch {
      // Fallback sang /auth/login nếu cần
      response = await api.post('/auth/login', { username, password });
    }

    const data = response.data;
    const authData: UserAuth = {
      token: data.token,
      userId: data.userId,
      username: data.username,
      fullName: data.fullName || data.username,
      role: (data.role || 'CUSTOMER').toUpperCase(),
    };

    localStorage.setItem('nhathuoc_token', authData.token);
    localStorage.setItem('nhathuoc_user', JSON.stringify(authData));
    setUser(authData);
    return authData;
  };

  const logout = () => {
    localStorage.removeItem('nhathuoc_token');
    localStorage.removeItem('nhathuoc_user');
    setUser(null);
  };

  const hasRole = (roles: string | string[]): boolean => {
    if (!user || !user.role) return false;
    const currentRole = user.role.toUpperCase();
    if (Array.isArray(roles)) {
      return roles.map((r) => r.toUpperCase()).includes(currentRole);
    }
    return currentRole === roles.toUpperCase();
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth phải được sử dụng bên trong AuthProvider');
  }
  return context;
};
