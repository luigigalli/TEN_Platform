import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Mock the api module
vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      me: vi.fn().mockImplementation(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }
        return { user: mockUser };
      }),
      login: vi.fn(),
      logout: vi.fn(),
    },
  },
}));

// Import the mocked api
import { api } from '@/lib/api';

// Mock wouter
vi.mock('wouter', () => ({
  useLocation: () => ['/test', vi.fn()],
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockUser = {
  id: '1',
  username: 'test',
  email: 'test@example.com',
  roles: [{ id: '1', name: 'ADMIN', description: 'Admin role' }],
};

describe('AuthProvider', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          cacheTime: 0,
          staleTime: 0,
          refetchOnMount: true,
          enabled: true,
          suspense: false,
          refetchOnWindowFocus: false,
          refetchInterval: false,
        },
      },
    });
    queryClient.clear();
    vi.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );

  it('should handle initial auth check', async () => {
    // Set token and mock API response
    localStorage.setItem('token', 'mock-token');

    // Render hook with initial state
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initial state should have no user
    expect(result.current.user).toBeUndefined();

    // Wait for the query to complete and verify results
    await waitFor(() => {
      expect(api.auth.me).toHaveBeenCalled();
      expect(result.current.user).toEqual(mockUser);
    });
  });

  it('should handle login success', async () => {
    // Mock successful login
    vi.mocked(api.auth.login).mockResolvedValueOnce({
      token: 'mock-token',
      user: mockUser,
    });

    // Mock successful auth check after login
    vi.mocked(api.auth.me).mockResolvedValueOnce({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login({ username: 'test', password: 'password' });
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toEqual(mockUser);
    });

    expect(localStorage.getItem('token')).toBe('mock-token');
  });

  it('should handle login failure', async () => {
    // Mock failed login
    const mockLoginCall = vi.mocked(api.auth.login).mockRejectedValueOnce(new Error('Invalid credentials'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      try {
        await result.current.login({ username: 'test', password: 'wrong' });
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect(error.message).toBe('Invalid credentials');
      }
    });

    expect(result.current.user).toBeUndefined();
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('should handle logout', async () => {
    vi.mocked(api.auth.logout).mockResolvedValueOnce(undefined);
    localStorage.setItem('token', 'mock-token');

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.user).toBeNull();
    });

    expect(localStorage.getItem('token')).toBeNull();
  });
});
