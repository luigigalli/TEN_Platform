import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock wouter
const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/', mockSetLocation],
}));

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      me: vi.fn(),
      login: vi.fn(),
      logout: vi.fn(),
      verifyEmail: vi.fn(),
      requestPasswordReset: vi.fn(),
      resetPassword: vi.fn(),
      updateProfile: vi.fn(),
    }
  }
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('AuthProvider', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    vi.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
    localStorageMock.getItem.mockReturnValue(null);
  });

  const mockUser = {
    id: '1',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
    role: 'ADMIN',
    permissions: ['manage_users', 'manage_roles', 'view_dashboard'],
    isVerified: true,
    notificationPreferences: {
      email: {
        marketing: true,
        security: true,
        updates: true,
        newsletter: true
      },
      inApp: {
        mentions: true,
        replies: true,
        directMessages: true,
        systemUpdates: true
      }
    }
  };

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  it('renders children', () => {
    const TestComponent = () => <div>Test Component</div>;
    render(<TestComponent />, { wrapper });
    expect(screen.getByText('Test Component')).toBeInTheDocument();
  });

  it('initializes with no user when no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.user).toBeNull();
    expect(mockSetLocation).toHaveBeenCalledWith('/auth');
  });

  it('fetches user data on mount when token exists', async () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    vi.mocked(api.auth.me).mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(api.auth.me).toHaveBeenCalledTimes(1);
    expect(result.current.user).toEqual(mockUser);
  });

  it('should handle initial auth check', async () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    vi.mocked(api.auth.me).mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('should handle login', async () => {
    const loginResponse = { token: 'new-token', user: mockUser };
    vi.mocked(api.auth.login).mockResolvedValue(loginResponse);
    vi.mocked(api.auth.me).mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for initial query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Initial state should be unauthenticated
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();

    // Perform login
    await act(async () => {
      await result.current.login({ email: 'test@example.com', password: 'password' });
    });

    // Login mutation should set token and redirect
    expect(localStorageMock.setItem).toHaveBeenCalledWith('token', 'new-token');
    expect(mockSetLocation).toHaveBeenCalledWith('/admin');

    // Wait for the auth query to complete
    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('should handle logout', async () => {
    vi.mocked(api.auth.logout).mockResolvedValue({});

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.logout();
    });

    await waitFor(() => {
      expect(localStorageMock.removeItem).toHaveBeenCalledWith('token');
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(mockSetLocation).toHaveBeenCalledWith('/auth');
    });
  });

  it('should handle email verification', async () => {
    vi.mocked(api.auth.verifyEmail).mockResolvedValue({ message: 'Email verified' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.verifyEmail('test-token');
    });

    await waitFor(() => {
      expect(api.auth.verifyEmail).toHaveBeenCalledWith('test-token');
      expect(mockSetLocation).toHaveBeenCalledWith('/auth');
    });
  });

  it('should handle password reset request', async () => {
    vi.mocked(api.auth.requestPasswordReset).mockResolvedValue({ message: 'Reset email sent' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.requestPasswordReset('test@example.com');
    });

    await waitFor(() => {
      expect(api.auth.requestPasswordReset).toHaveBeenCalledWith('test@example.com');
    });
  });

  it('should handle password reset', async () => {
    vi.mocked(api.auth.resetPassword).mockResolvedValue({ message: 'Password reset successful' });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.resetPassword('test-token', 'new-password');
    });

    await waitFor(() => {
      expect(api.auth.resetPassword).toHaveBeenCalledWith('test-token', 'new-password');
      expect(mockSetLocation).toHaveBeenCalledWith('/auth');
    });
  });

  it('should handle profile update', async () => {
    localStorageMock.getItem.mockReturnValue('test-token');
    vi.mocked(api.auth.me).mockResolvedValue({ user: mockUser });
    vi.mocked(api.auth.updateProfile).mockResolvedValue({ user: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.updateProfile({ firstName: 'Updated' });
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
    });
  });
});
