import { User, Role, Permission } from '@db/schema';

declare global {
  namespace Express {
    interface User extends Omit<User, 'password'> {
      roles: (Role & { permissions: Permission[] })[];
    }
  }
}
