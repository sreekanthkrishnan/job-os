import { create } from 'zustand';
import { User, AuthResponse } from '@/types';
import { api } from '@/services/api';

const getStorageItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.getItem === 'function') {
      return window.localStorage.getItem(key);
    }
  } catch {
    // Ignore storage errors
  }
  return null;
};

const setStorageItem = (key: string, value: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.setItem === 'function') {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage errors
  }
};

const removeStorageItem = (key: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage && typeof window.localStorage.removeItem === 'function') {
      window.localStorage.removeItem(key);
    }
  } catch {
    // Ignore storage errors
  }
};

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  setAuth: (user: User, token: string, refreshToken?: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<boolean>;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: getStorageItem('access_token'),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setAuth: (user, token, refreshToken) => {
    setStorageItem('access_token', token);
    if (refreshToken) {
      setStorageItem('refresh_token', refreshToken);
    }
    set({ user, token, isAuthenticated: true, error: null });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AuthResponse['data']>('/auth/login/', { email, password });
      if (res.success && res.data) {
        const { user, tokens } = res.data;
        setStorageItem('access_token', tokens.access);
        setStorageItem('refresh_token', tokens.refresh);
        set({ user, token: tokens.access, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ error: res.message || 'Login failed', isLoading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  signup: async (email, password, firstName = '', lastName = '') => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post<AuthResponse['data']>('/auth/signup/', {
        email,
        password,
        password_confirm: password,
        first_name: firstName,
        last_name: lastName,
      });
      if (res.success && res.data) {
        const { user, tokens } = res.data;
        setStorageItem('access_token', tokens.access);
        setStorageItem('refresh_token', tokens.refresh);
        set({ user, token: tokens.access, isAuthenticated: true, isLoading: false });
        return true;
      }
      set({ error: res.message || 'Registration failed', isLoading: false });
      return false;
    } catch (err: any) {
      set({ error: err.message || 'Registration failed', isLoading: false });
      return false;
    }
  },

  logout: () => {
    removeStorageItem('access_token');
    removeStorageItem('refresh_token');
    set({ user: null, token: null, isAuthenticated: false, error: null, isLoading: false });
  },

  checkAuth: async () => {
    const token = getStorageItem('access_token');
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await api.get<User>('/auth/me/');
      if (res.success && res.data) {
        set({ user: res.data, isAuthenticated: true, isLoading: false });
      } else {
        removeStorageItem('access_token');
        removeStorageItem('refresh_token');
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch {
      removeStorageItem('access_token');
      removeStorageItem('refresh_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
