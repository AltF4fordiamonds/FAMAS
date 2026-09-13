import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../services/api.js';
import { User, UserRole, DriverStatus } from '../types.js';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  role?: UserRole;
  firstName?: string;
  lastName?: string;
  phone?: string;
  licenseCategory?: string;
  experienceYears?: number;
  status?: DriverStatus;
  assignedVehicle?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (loginInput: string, passwordInput: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  demoLogin: (role: UserRole) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Use sessionStorage so starting the application always presents the login/registration screen
  const [user, setUser] = useState<User | null>(() => {
    // Clear any stale legacy localStorage on startup so users are not trapped
    if (!sessionStorage.getItem('fleet_session_active')) {
      localStorage.removeItem('fleet_token');
      localStorage.removeItem('fleet_user');
      return null;
    }
    const saved = sessionStorage.getItem('fleet_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [token, setToken] = useState<string | null>(() => {
    if (!sessionStorage.getItem('fleet_session_active')) {
      return null;
    }
    return sessionStorage.getItem('fleet_token') || null;
  });

  const [loading, setLoading] = useState<boolean>(false);

  const refreshUser = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      if (res.data?.user) {
        setUser(res.data.user);
        sessionStorage.setItem('fleet_user', JSON.stringify(res.data.user));
      }
    } catch (err) {
      console.warn('Failed to verify token on refresh', err);
      setUser(null);
      setToken(null);
      sessionStorage.removeItem('fleet_session_active');
      sessionStorage.removeItem('fleet_token');
      sessionStorage.removeItem('fleet_user');
      localStorage.removeItem('fleet_token');
      localStorage.removeItem('fleet_user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token]);

  const login = async (loginInput: string, passwordInput: string) => {
    const cleanInput = loginInput.trim();
    const res = await api.post('/auth/login', {
      email: cleanInput,
      login: cleanInput,
      password: passwordInput,
    });

    const { token: receivedToken, user: receivedUser } = res.data;
    sessionStorage.setItem('fleet_session_active', 'true');
    sessionStorage.setItem('fleet_token', receivedToken);
    sessionStorage.setItem('fleet_user', JSON.stringify(receivedUser));
    setToken(receivedToken);
    setUser(receivedUser);
    setLoading(false);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post('/auth/register', data);
    const { token: receivedToken, user: receivedUser } = res.data;
    if (receivedToken) {
      sessionStorage.setItem('fleet_session_active', 'true');
      sessionStorage.setItem('fleet_token', receivedToken);
      sessionStorage.setItem('fleet_user', JSON.stringify(receivedUser));
      setToken(receivedToken);
      setUser(receivedUser);
    }
  };

  const demoLogin = async (role: UserRole) => {
    const credentials = {
      admin: { login: 'admin@fleet.com', password: 'admin123' },
      dispatcher: { login: 'dispatcher@fleet.com', password: 'dispatch123' },
      driver: { login: 'driver.john@fleet.com', password: 'driver123' },
    };
    const cred = credentials[role];
    await login(cred.login, cred.password);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    sessionStorage.removeItem('fleet_session_active');
    sessionStorage.removeItem('fleet_token');
    sessionStorage.removeItem('fleet_user');
    localStorage.removeItem('fleet_token');
    localStorage.removeItem('fleet_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        demoLogin,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
