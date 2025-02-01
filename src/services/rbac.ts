import { AppDataSource } from '../data-source';
import { Role } from '../entities/Role';
import { Permission } from '../entities/Permission';
import { User } from '../models/User';

export class RBACService {
  private roleRepository = AppDataSource.getRepository(Role);
  private permissionRepository = AppDataSource.getRepository(Permission);
  private userRepository = AppDataSource.getRepository(User);

  async getAllRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      relations: ['permissions']
    });
  }

  async getRoleById(id: string): Promise<Role | null> {
    return this.roleRepository.findOne({
      where: { id },
      relations: ['permissions']
    });
  }

  async createRole(name: string, permissionIds: string[]): Promise<Role> {
    const permissions = await this.permissionRepository.findByIds(permissionIds);
    const role = this.roleRepository.create({
      name,
      permissions
    });
    return this.roleRepository.save(role);
  }

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions']
    });
    if (!role) {
      throw new Error('Role not found');
    }
    const permissions = await this.permissionRepository.findByIds(permissionIds);
    role.permissions = permissions;
    return this.roleRepository.save(role);
  }

  async deleteRole(id: string): Promise<void> {
    await this.roleRepository.delete(id);
  }

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    const role = await this.roleRepository.findOne({
      where: { id: roleId },
      relations: ['permissions']
    });
    if (!role) {
      throw new Error('Role not found');
    }
    return role.permissions;
  }

  async hasPermission(userId: string, requiredPermission: string): Promise<boolean> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions']
    });

    if (!user) {
      return false;
    }

    // Flatten user's permissions from all roles
    const userPermissions = user.roles.flatMap(role => 
      role.permissions.map(p => p.name)
    );

    return userPermissions.includes(requiredPermission);
  }

  async getUserRoles(userId: string): Promise<Role[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles']
    });
    if (!user) {
      throw new Error('User not found');
    }
    return user.roles;
  }

  async assignRoleToUser(userId: string, roleId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles']
    });
    if (!user) {
      throw new Error('User not found');
    }
    const role = await this.roleRepository.findOne({
      where: { id: roleId }
    });
    if (!role) {
      throw new Error('Role not found');
    }
    user.roles.push(role);
    await this.userRepository.save(user);
  }

  async removeRoleFromUser(userId: string, roleId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles']
    });
    if (!user) {
      throw new Error('User not found');
    }
    const role = user.roles.find(r => r.id === roleId);
    if (!role) {
      throw new Error('Role not found');
    }
    user.roles = user.roles.filter(r => r.id !== roleId);
    await this.userRepository.save(user);
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.permissionRepository.find();
  }
}
