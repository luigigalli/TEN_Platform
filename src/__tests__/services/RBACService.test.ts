import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import sinon from 'sinon';
import { RBACService } from '../../services/RBACService';

describe('RBACService', () => {
  let rbacService: RBACService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: sinon.stub()
      },
      userRole: {
        create: sinon.stub(),
        deleteMany: sinon.stub()
      },
      role: {
        create: sinon.stub(),
        update: sinon.stub(),
        delete: sinon.stub()
      },
      permission: {
        deleteMany: sinon.stub()
      }
    };
    rbacService = new RBACService(mockPrisma as any);
  });

  describe('hasPermission', () => {
    it('should return true if user has direct permission', async () => {
      const userId = '123';
      const permission = 'user:read';

      mockPrisma.user.findUnique.resolves({
        id: userId,
        permissions: [{ name: permission }],
        roles: []
      });

      const result = await rbacService.hasPermission(userId, permission);
      expect(result).to.be.true;
    });

    it('should return true if user has permission through role', async () => {
      const userId = '123';
      const permission = 'user:read';

      mockPrisma.user.findUnique.resolves({
        id: userId,
        permissions: [],
        roles: [{
          role: {
            permissions: [{ name: permission }]
          }
        }]
      });

      const result = await rbacService.hasPermission(userId, permission);
      expect(result).to.be.true;
    });

    it('should return false if user does not have permission', async () => {
      const userId = '123';
      const permission = 'user:read';

      mockPrisma.user.findUnique.resolves({
        id: userId,
        permissions: [],
        roles: [{
          role: {
            permissions: []
          }
        }]
      });

      const result = await rbacService.hasPermission(userId, permission);
      expect(result).to.be.false;
    });
  });

  // ... rest of the test cases adapted to use chai assertions
});
