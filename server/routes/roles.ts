import { Router, type Express, Request, Response } from 'express';
import { RBACService } from '../src/services/rbac.drizzle';
import { authenticate } from '../src/middleware/auth';
import { authorizeResource } from '../src/middleware/auth.drizzle';
import { wrapAsync } from '../src/middleware/error';

const router = Router();
const rbacService = new RBACService();

// Get all roles
router.get('/', authenticate, authorizeResource('roles', 'read'), wrapAsync(async (_req: Request, res: Response) => {
  const roles = await rbacService.getRoles();
  res.json(roles);
}));

// Get role by ID
router.get('/:id', authenticate, authorizeResource('roles', 'read'), wrapAsync(async (req: Request, res: Response) => {
  const role = await rbacService.getRole(req.params.id);
  if (!role) {
    res.status(404).json({ message: 'Role not found' });
    return;
  }
  res.json(role);
}));

// Create new role
router.post('/', authenticate, authorizeResource('roles', 'create'), wrapAsync(async (req: Request, res: Response) => {
  const { name, description, permissions } = req.body;
  const role = await rbacService.createRole(name, description, permissions);
  res.status(201).json(role);
}));

// Update role
router.put('/:id', authenticate, authorizeResource('roles', 'update'), wrapAsync(async (req: Request, res: Response) => {
  const { name, description, permissions } = req.body;
  const role = await rbacService.updateRole(req.params.id, name, description, permissions);
  res.json(role);
}));

// Delete role
router.delete('/:id', authenticate, authorizeResource('roles', 'delete'), wrapAsync(async (req: Request, res: Response) => {
  await rbacService.deleteRole(req.params.id);
  res.status(204).send();
}));

// Get role permissions
router.get('/:id/permissions', authenticate, authorizeResource('roles', 'read'), wrapAsync(async (req: Request, res: Response) => {
  const permissions = await rbacService.getRolePermissions(req.params.id);
  res.json(permissions);
}));

export function setupRoleRoutes(app: Express): void {
  app.use('/api/roles', router);
  console.log('Role routes registered:');
  console.log('GET /api/roles');
  console.log('GET /api/roles/:id');
  console.log('POST /api/roles');
  console.log('PUT /api/roles/:id');
  console.log('DELETE /api/roles/:id');
  console.log('GET /api/roles/:id/permissions');
}
