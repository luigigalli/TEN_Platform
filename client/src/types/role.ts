import { UserRole } from './user';

export interface Permission {
  id: string;
  name: string;
  description?: string;
  category: PermissionCategory;
  action: PermissionAction;
  subject: string;
}

export enum PermissionCategory {
  USER_MANAGEMENT = 'user_management',
  PROFILE = 'profile',
  CUSTOMERS = 'customers',
  BOOKING = 'booking',
  CATALOG = 'catalog',
  CONTENT = 'content',
  MEDIA = 'media',
  SETTINGS = 'settings'
}

export enum PermissionAction {
  VIEW = 'view',
  CREATE = 'create',
  EDIT = 'edit',
  DELETE = 'delete',
  MANAGE = 'manage' // For more complex actions like approve/reject
}

export enum RoleType {
  SYSTEM = 'system',     // Built-in roles that cannot be modified (e.g., Super Admin)
  REGULAR = 'regular',   // Custom roles that can be modified
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  type: RoleType;
  isSystem?: boolean;
  permissions: string[];  // List of permission IDs
  createdAt: string;
  updatedAt: string;
}

// For the role list view
export interface RoleListItem {
  id: string;
  name: string;
  description?: string;
  type: RoleType;
  isSystem?: boolean;
  userCount: number;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

// For creating/updating roles
export interface RoleInput {
  name: string;
  description?: string;
  type: RoleType;
  permissions: string[];  // List of permission IDs to grant
}
