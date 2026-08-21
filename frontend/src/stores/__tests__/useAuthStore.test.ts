// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '../useAuthStore';

// Mock localStorage for Node 25 compatibility
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: (key: string) => mockStorage[key] || null,
  setItem: (key: string, value: string) => { mockStorage[key] = value; },
  removeItem: (key: string) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true
});

describe('useAuthStore', () => {
  beforeEach(() => {
    window.localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
    });
  });

  it('initializes with default empty auth state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('updates state when setAuth is invoked', () => {
    const mockUser = {
      id: 'usr-1',
      email: 'test@jobos.io',
      first_name: 'Test',
      last_name: 'User',
      created_at: new Date().toISOString(),
    };

    useAuthStore.getState().setAuth(mockUser, 'mock-access-token');

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.user?.email).toBe('test@jobos.io');
    expect(window.localStorage.getItem('access_token')).toBe('mock-access-token');
  });

  it('clears state on logout', () => {
    window.localStorage.setItem('access_token', 'sample-token');
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.user).toBeNull();
    expect(window.localStorage.getItem('access_token')).toBeNull();
  });
});
