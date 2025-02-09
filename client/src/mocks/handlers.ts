import { http, HttpResponse } from 'msw';
import { UserRole, UserStatus } from '@/types/auth';

// Mock user data
const mockUsers = [
  {
    id: '1',
    email: 'admin@tenplatform.com',
    firstName: 'Admin',
    lastName: 'User',
    role: UserRole.SUPER_ADMIN,
    permissions: ['*'],
    emailVerified: true,
    active: true,
    status: UserStatus.ACTIVE,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    lastLogin: '2024-02-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'john@example.com',
    firstName: 'John',
    lastName: 'Doe',
    role: UserRole.USER,
    permissions: ['read:own'],
    emailVerified: true,
    active: true,
    status: UserStatus.ACTIVE,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z',
    lastLogin: '2024-02-02T00:00:00Z',
  },
  {
    id: '3',
    email: 'jane@example.com',
    firstName: 'Jane',
    lastName: 'Smith',
    role: UserRole.ADMIN,
    permissions: ['read:*', 'write:own'],
    emailVerified: true,
    active: true,
    status: UserStatus.ACTIVE,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z',
    lastLogin: '2024-02-03T00:00:00Z',
  }
];

// Mock roles data
const mockRoles = [
  {
    id: '1',
    name: 'Super Admin',
    description: 'Full system access',
    type: 'SYSTEM',
    isSystem: true,
    permissions: ['*'],
    userCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Admin',
    description: 'Administrative access',
    type: 'SYSTEM',
    isSystem: true,
    permissions: ['read:*', 'write:*'],
    userCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'User',
    description: 'Regular user access',
    type: 'SYSTEM',
    isSystem: true,
    permissions: ['read:own', 'write:own'],
    userCount: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

// Mock permissions data
const mockPermissions = [
  {
    id: '1',
    name: 'manage_users',
    description: 'Can manage users',
    category: 'USER_MANAGEMENT',
    action: 'MANAGE',
  },
  {
    id: '2',
    name: 'view_users',
    description: 'Can view users',
    category: 'USER_MANAGEMENT',
    action: 'VIEW',
  },
  {
    id: '3',
    name: 'manage_roles',
    description: 'Can manage roles',
    category: 'USER_MANAGEMENT',
    action: 'MANAGE',
  }
];

export const handlers = [
  // Auth endpoints
  http.post('/api/auth/login', async ({ request }) => {
    const { email, password } = await request.json();
    
    // In development, check for the registered admin user
    if (email === 'admin@tenplatform.com' && password === 'Admin123!') {
      const mockUser = mockUsers[0];
      const mockToken = 'mock-token-123';

      return HttpResponse.json({ 
        token: mockToken,
        user: mockUser,
      });
    }

    // Return error for invalid credentials
    return new HttpResponse(
      JSON.stringify({ message: 'Invalid email or password' }), 
      { status: 401 }
    );
  }),

  http.get('/api/auth/me', () => {
    return HttpResponse.json(mockUsers[0]);
  }),

  // Users endpoints
  http.get('/api/users', ({ request }) => {
    console.log('Handling /api/users request');
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const role = url.searchParams.get('role');
    const status = url.searchParams.get('status');

    let filteredUsers = [...mockUsers];

    if (search) {
      filteredUsers = filteredUsers.filter(user => 
        user.email.toLowerCase().includes(search) ||
        user.firstName.toLowerCase().includes(search) ||
        user.lastName.toLowerCase().includes(search)
      );
    }

    if (role) {
      filteredUsers = filteredUsers.filter(user => user.role === role);
    }

    if (status) {
      filteredUsers = filteredUsers.filter(user => 
        user.status === status
      );
    }

    console.log('Returning filtered users:', filteredUsers);
    return HttpResponse.json(filteredUsers);
  }),

  http.post('/api/users', async ({ request }) => {
    const userData = await request.json();
    const newUser = {
      ...userData,
      id: String(mockUsers.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLogin: null,
      status: UserStatus.ACTIVE,
      emailVerified: false,
      active: true,
    };
    mockUsers.push(newUser);
    return HttpResponse.json(newUser);
  }),

  // Roles endpoints
  http.get('/api/roles', () => {
    console.log('Handling /api/roles request');
    console.log('Returning roles:', mockRoles);
    return HttpResponse.json(mockRoles);
  }),

  http.post('/api/roles', async ({ request }) => {
    const role = await request.json();
    const newRole = {
      ...role,
      id: String(mockRoles.length + 1),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockRoles.push(newRole);
    return HttpResponse.json(newRole);
  }),

  http.delete('/api/roles/:id', ({ params }) => {
    const { id } = params;
    const index = mockRoles.findIndex(role => role.id === id);
    if (index > -1) {
      mockRoles.splice(index, 1);
    }
    return HttpResponse.json({ success: true });
  }),

  // Permissions endpoints
  http.get('/api/permissions', ({ request }) => {
    console.log('Handling /api/permissions request');
    const url = new URL(request.url);
    const search = url.searchParams.get('search')?.toLowerCase();
    const category = url.searchParams.get('category');

    let filteredPermissions = [...mockPermissions];

    if (search) {
      filteredPermissions = filteredPermissions.filter(permission => 
        permission.name.toLowerCase().includes(search) ||
        permission.description?.toLowerCase().includes(search)
      );
    }

    if (category) {
      filteredPermissions = filteredPermissions.filter(permission => 
        permission.category === category
      );
    }

    console.log('Returning filtered permissions:', filteredPermissions);
    return HttpResponse.json(filteredPermissions);
  }),
];
