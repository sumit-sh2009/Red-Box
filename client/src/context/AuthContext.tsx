import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '../types/index.js';
import { api } from '../utils/api.js';
import { sound } from '../utils/sound.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (credentials: { username: string; password: string }) => Promise<void>;
  signup: (data: {
    username: string;
    display_name: string;
    password: string;
    bio?: string;
    avatar_id?: string;
    banner_color?: string;
  }) => Promise<void>;
  logout: () => void;
  updateProfile: (data: {
    display_name?: string;
    bio?: string;
    avatar_id?: string;
    banner_color?: string;
  }) => Promise<void>;
  authModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('pixel_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'signup'>('login');

  const refreshUser = useCallback(async () => {
    const storedToken = localStorage.getItem('pixel_token');
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const res = await api.auth.me();
      setUser(res.user);
    } catch (err) {
      console.warn('Session expired or invalid, logging out:', err);
      localStorage.removeItem('pixel_token');
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (credentials: { username: string; password: string }) => {
    const res = await api.auth.login(credentials);
    localStorage.setItem('pixel_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    sound.playChirp();
  };

  const signup = async (data: {
    username: string;
    display_name: string;
    password: string;
    bio?: string;
    avatar_id?: string;
    banner_color?: string;
  }) => {
    const res = await api.auth.signup(data);
    localStorage.setItem('pixel_token', res.token);
    setToken(res.token);
    setUser(res.user);
    setAuthModalOpen(false);
    sound.playChirp();
  };

  const logout = () => {
    localStorage.removeItem('pixel_token');
    setToken(null);
    setUser(null);
    sound.playDelete();
  };

  const updateProfile = async (data: {
    display_name?: string;
    bio?: string;
    avatar_id?: string;
    banner_color?: string;
  }) => {
    const res = await api.users.updateProfile(data);
    setUser(res.user);
    sound.playNotification();
  };

  const openAuthModal = (mode: 'login' | 'signup' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
    sound.playClick();
  };

  const closeAuthModal = () => {
    setAuthModalOpen(false);
    sound.playClick();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signup,
        logout,
        updateProfile,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
