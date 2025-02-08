import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, fireEvent, render } from '@testing-library/react';
import { AuthProvider } from '@/providers/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';

// Mock icons
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <div data-testid="dashboard-icon" />,
  Users: () => <div data-testid="users-icon" />,
  Menu: () => <div data-testid="menu-icon" />,
  User: () => <div data-testid="user-icon" />,
  LogOut: () => <div data-testid="logout-icon" />,
  Shield: () => <div data-testid="shield-icon" />,
  ChevronDown: () => <div data-testid="chevron-down-icon" />,
}));

// Mock wouter
vi.mock('wouter', () => ({
  Link: ({ children, to }: any) => <a href={to}>{children}</a>,
  Route: ({ children, path }: any) => <div data-path={path}>{children}</div>,
  useLocation: () => ['/admin', () => {}],
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <div onClick={onClick}>{children}</div>
  ),
  DropdownMenuSeparator: () => <hr />,
}));

// Mock API
vi.mock('@/lib/api', () => ({
  api: {
    auth: {
      me: vi.fn().mockResolvedValue({
        data: {
          id: '1',
          email: 'admin@example.com',
          firstName: 'Admin',
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
        }
      }),
    }
  },
}));

// Import after mocks
import { AdminLayout } from '../AdminLayout';

describe('AdminLayout', () => {
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
  });

  const renderWithProviders = (ui: React.ReactNode) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          {ui}
        </AuthProvider>
      </QueryClientProvider>
    );
  };

  it('renders navigation items based on permissions', async () => {
    renderWithProviders(<AdminLayout>Test</AdminLayout>);

    await screen.findByText('Users');
    expect(screen.getByText('Users')).toBeInTheDocument();
    expect(screen.getByText('Roles')).toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('displays user information in dropdown', async () => {
    renderWithProviders(<AdminLayout>Test</AdminLayout>);

    await screen.findByText('Admin User');
    expect(screen.getByText('Admin User')).toBeInTheDocument();
    expect(screen.getByText('admin@example.com')).toBeInTheDocument();
  });

  it('handles logout', async () => {
    renderWithProviders(<AdminLayout>Test</AdminLayout>);

    await screen.findByText('Sign out');
    fireEvent.click(screen.getByText('Sign out'));
  });

  it('hides restricted navigation items without permissions', async () => {
    vi.mocked(api.auth.me).mockResolvedValueOnce({
      data: {
        id: '1',
        email: 'user@example.com',
        firstName: 'Regular',
        lastName: 'User',
        role: 'USER',
        permissions: ['view_dashboard'],
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
      }
    });

    renderWithProviders(<AdminLayout>Test</AdminLayout>);

    await screen.findByText('Dashboard');
    expect(screen.queryByText('Users')).not.toBeInTheDocument();
    expect(screen.queryByText('Roles')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });
});
