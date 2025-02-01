import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import AdminLayout from '../AdminLayout';

// Mock icons
vi.mock('lucide-react', () => ({
  LayoutDashboard: () => <span>LayoutDashboard</span>,
  Users: () => <span>Users</span>,
  Menu: () => <span>Menu</span>,
  User: () => <span>User</span>,
  LogOut: () => <span>LogOut</span>,
}));

// Mock wouter
vi.mock('wouter', () => ({
  Link: ({ children, href, className }: any) => (
    <a href={href} className={className}>{children}</a>
  ),
  useLocation: () => ['/admin', () => {}],
  Switch: ({ children }: any) => <div>{children}</div>,
  Route: ({ children, path }: any) => <div data-path={path}>{children}</div>,
}));

// Mock pages
vi.mock('@/pages/admin/DashboardPage', () => ({
  default: () => <div>Dashboard Page</div>,
}));

vi.mock('@/pages/admin/UsersPage', () => ({
  default: () => <div>Users Page</div>,
}));

// Mock auth hook
vi.mock('@/providers/AuthProvider', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useAuth: () => ({
    user: { id: '1', name: 'Test User' },
    logout: vi.fn(),
  }),
}));

// Mock UI components
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, ...props }: any) => (
    <button onClick={onClick} {...props}>{children}</button>
  ),
}));

vi.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: any) => <div data-testid="dropdown">{children}</div>,
  DropdownMenuTrigger: ({ children }: any) => <div data-testid="trigger">{children}</div>,
  DropdownMenuContent: ({ children }: any) => <div data-testid="content">{children}</div>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick} data-testid="menu-item">{children}</button>
  ),
  DropdownMenuLabel: ({ children }: any) => <div data-testid="label">{children}</div>,
  DropdownMenuSeparator: () => <hr data-testid="separator" />,
}));

// Mock utility functions
vi.mock('@/lib/utils', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

describe('AdminLayout', () => {
  it('renders navigation items', () => {
    renderWithProviders(<AdminLayout />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getAllByText('Users')).toHaveLength(2); // We expect two instances of "Users"
  });

  it('renders user menu', () => {
    renderWithProviders(<AdminLayout />);
    expect(screen.getByTestId('dropdown')).toBeInTheDocument();
  });
});
