import chai from 'chai';
import sinonChai from 'sinon-chai';
import { expect } from 'chai';
import { describe, it, beforeEach } from 'mocha';
import sinon from 'sinon';
import { Request, Response } from 'express';
import { requirePermission } from '../../middleware/rbac';

chai.use(sinonChai);

interface RequestWithUser extends Request {
  user?: {
    id: string;
    email: string;
  };
  prisma?: any;
}

describe('RBAC Middleware', () => {
  let mockReq: Partial<RequestWithUser>;
  let mockRes: Partial<Response>;
  let mockNext: sinon.SinonSpy;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      user: {
        findUnique: sinon.stub()
      }
    };

    mockReq = {
      user: {
        id: '123',
        email: 'test@example.com'
      },
      prisma: mockPrisma
    };

    mockRes = {
      status: sinon.stub().returnsThis(),
      json: sinon.stub()
    };

    mockNext = sinon.spy();
  });

  describe('requirePermission', () => {
    it('should call next() if user has required permission', async () => {
      const permission = 'user:read';
      mockPrisma.user.findUnique.resolves({
        id: '123',
        permissions: [{ name: permission }],
        roles: []
      });

      const middleware = requirePermission(permission);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).to.have.been.called;
      expect(mockRes.status).to.not.have.been.called;
    });

    it('should return 403 if user does not have required permission', async () => {
      const permission = 'user:read';
      mockPrisma.user.findUnique.resolves({
        id: '123',
        permissions: [],
        roles: []
      });

      const middleware = requirePermission(permission);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).to.have.been.calledWith(403);
      expect(mockRes.json).to.have.been.calledWith({
        error: 'Forbidden',
        message: 'Insufficient permissions'
      });
      expect(mockNext).to.not.have.been.called;
    });

    it('should handle missing user in request', async () => {
      const permission = 'user:read';
      mockReq.user = undefined;

      const middleware = requirePermission(permission);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).to.have.been.calledWith(401);
      expect(mockRes.json).to.have.been.calledWith({
        error: 'Unauthorized',
        message: 'Authentication required'
      });
      expect(mockNext).to.not.have.been.called;
    });

    it('should handle errors from RBAC service', async () => {
      const permission = 'user:read';
      mockPrisma.user.findUnique.rejects(new Error('Database error'));

      const middleware = requirePermission(permission);
      await middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).to.have.been.calledWith(500);
      expect(mockRes.json).to.have.been.calledWith({
        error: 'Internal Server Error',
        message: 'Error checking permissions'
      });
      expect(mockNext).to.not.have.been.called;
    });
  });
});
