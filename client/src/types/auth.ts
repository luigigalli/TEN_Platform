export const UserRole = {
  ADMIN: 'admin',
  ACCOUNTANT: 'accountant',
  EDITOR: 'editor',
  AUTHOR: 'author',
  CUSTOMER_SUPPORT: 'customer_support',
  LOCAL_EXPERT: 'local_expert',
  ACTIVITY_SUPPLIER: 'activity_supplier',
  ACCOMMODATION_SUPPLIER: 'accommodation_supplier',
  CUSTOMER: 'customer',
  SERVICE_PROVIDER: 'service_provider',
  MANAGER: 'manager',
  USER: 'user'
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended'
}

export enum BusinessType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
  PARTNERSHIP = 'partnership',
  NON_PROFIT = 'non_profit'
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  status?: UserStatus;
  phoneNumber?: string;
  department?: string;
}

export interface UserListItem extends User {
  createdAt: string;
  lastLogin?: string;
}

export interface ServiceProviderProfile {
  businessName: string;
  businessType: BusinessType;
  vatNumber?: string;
}

export interface UserProfile extends User {
  serviceProvider?: ServiceProviderProfile;
}
