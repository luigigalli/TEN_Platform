export enum UserRole {
  // System Roles
  SUPER_ADMIN = 'super_admin', // Has access to all sensitive operations
  
  // Administrative Users
  ADMIN = 'admin',
  ACCOUNTANT = 'accountant',
  EDITOR = 'editor',
  AUTHOR = 'author',
  CUSTOMER_SUPPORT = 'customer_support',

  // External Users
  LOCAL_EXPERT = 'local_expert',
  ACTIVITY_SUPPLIER = 'activity_supplier',
  ACCOMMODATION_SUPPLIER = 'accommodation_supplier',
  CUSTOMER = 'customer',
  SERVICE_PROVIDER = 'service_provider',
  MANAGER = 'manager',
  USER = 'user',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  PENDING = 'pending',
  SUSPENDED = 'suspended',
}

export enum BusinessType {
  INDIVIDUAL = 'individual',
  COMPANY = 'company',
}

export enum AddressType {
  BILLING = 'billing',
  BUSINESS = 'business',
  HOME = 'home',
}

export enum SensitiveOperation {
  DELETE_ROLE = 'delete_role',
  MODIFY_SYSTEM_ROLES = 'modify_system_roles',
  ASSIGN_SUPER_ADMIN = 'assign_super_admin',
  MODIFY_PERMISSIONS = 'modify_permissions',
  ACCESS_SYSTEM_SETTINGS = 'access_system_settings',
}

export interface UserAccount {
  id: string;
  email: string;
  status: UserStatus;
  role: UserRole;
  emailVerified: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  userId: string;
  prefix?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  phoneNumber?: string;
  department?: string;
  imageUrl?: string;
}

export interface ServiceProviderProfile {
  userId: string;
  businessName?: string;
  vatNumber?: string;
  businessType: BusinessType;
  skills: UserSkill[];
  rating: number;
  reviewCount: number;
  description?: string;
  website?: string;
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    linkedin?: string;
  };
}

export interface UserSkill {
  id: string;
  name: string;
  yearsOfExperience?: number;
  certifications?: string[];
  level?: 'beginner' | 'intermediate' | 'expert';
}

export interface UserAddress {
  id: string;
  userId: string;
  type: AddressType;
  street: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

export interface UserFinancials {
  userId: string;
  bankName?: string;
  accountNumber?: string;
  iban?: string;
  swift?: string;
  currency: string;
  paymentTerms?: string;
  taxInformation?: {
    vatNumber?: string;
    taxId?: string;
    taxResidenceCountry?: string;
  };
}

export interface Activity {
  id: string;
  providerId: string;
  title: string;
  description: string;
  location: ActivityLocation;
  pricing: ActivityPricing;
  status: 'active' | 'inactive' | 'draft';
  category: string;
  subcategory?: string;
  images: string[];
  capacity: {
    min: number;
    max: number;
  };
  duration: {
    value: number;
    unit: 'minutes' | 'hours' | 'days';
  };
  bookingPolicy?: {
    cancellation: string;
    refund: string;
    minimumNotice: string;
  };
}

export interface ActivityLocation {
  address: string;
  city: string;
  state?: string;
  country: string;
  postalCode: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

export interface ActivityPricing {
  basePrice: number;
  currency: string;
  pricingType: 'per_person' | 'fixed' | 'custom';
  discounts?: {
    type: 'group' | 'early_bird' | 'seasonal';
    value: number;
    isPercentage: boolean;
    conditions?: string;
  }[];
  additionalCosts?: {
    name: string;
    amount: number;
    isOptional: boolean;
    description?: string;
  }[];
}

export interface Organization {
  id: string;
  ownerId: string;
  name: string;
  type: string;
  status: 'active' | 'inactive';
  description?: string;
  logo?: string;
  website?: string;
  foundedYear?: number;
  size?: string;
  industry?: string;
  contactInfo: {
    email: string;
    phone?: string;
    address: UserAddress;
  };
}

// Combined user type for the main users list
export interface UserListItem extends UserAccount {
  profile: UserProfile;
  serviceProvider?: ServiceProviderProfile;
  primaryAddress?: UserAddress;
}

// Detailed user type for the user details page
export interface UserDetails {
  account: UserAccount;
  profile: UserProfile;
  serviceProvider?: ServiceProviderProfile;
  addresses: UserAddress[];
  financials?: UserFinancials;
  activities?: Activity[];
  organizations?: Organization[];
}
