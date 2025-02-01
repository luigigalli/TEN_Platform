import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import request from 'supertest';
import { app } from '../../app';
import { RBACService } from '../../services/rbac';

describe('RBAC Integration Tests', () => {
  let rbacService: RBACService;
  let hasPermissionStub: sinon.SinonStub<[string, string], Promise<boolean>>;

  beforeEach(() => {
    rbacService = new RBACService();
    // Stub the hasPermission method with explicit types
    hasPermissionStub = sinon.stub(rbacService, 'hasPermission').resolves(false);
  });

  afterEach(() => {
    sinon.restore(); // Cleanup all stubs/spies
  });

  describe('Protected Routes', () => {
    it('should allow access when user has required permission', async () => {
      hasPermissionStub.resolves(true);

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer validToken');

      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ message: 'Access granted' });
      expect(hasPermissionStub).to.have.been.calledOnceWithExactly(sinon.match.string, 'protected:access');
    });

    it('should deny access when user lacks required permission', async () => {
      hasPermissionStub.resolves(false);

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer validToken');

      expect(response.status).to.equal(403);
      expect(response.body).to.deep.equal({
        status: 'error',
        code: 'FORBIDDEN_ERROR',
        message: 'Insufficient permissions'
      });
      expect(hasPermissionStub).to.have.been.calledOnceWithExactly(sinon.match.string, 'protected:access');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/protected');

      expect(response.status).to.equal(401);
      expect(response.body).to.deep.equal({
        status: 'error',
        code: 'UNAUTHORIZED_ERROR',
        message: 'Authentication required'
      });
      expect(hasPermissionStub).not.to.have.been.called;
    });
  });

  describe('Role-based Routes', () => {
    it('should allow admin access to admin routes', async () => {
      hasPermissionStub.resolves(true);

      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', 'Bearer adminToken');

      expect(response.status).to.equal(200);
      expect(response.body).to.deep.equal({ message: 'Admin access granted' });
      expect(hasPermissionStub).to.have.been.calledOnceWithExactly(sinon.match.string, 'admin:access');
    });

    it('should deny regular user access to admin routes', async () => {
      hasPermissionStub.resolves(false);

      const response = await request(app)
        .get('/api/admin')
        .set('Authorization', 'Bearer regularToken');

      expect(response.status).to.equal(403);
      expect(response.body).to.deep.equal({
        status: 'error',
        code: 'FORBIDDEN_ERROR',
        message: 'Insufficient permissions'
      });
      expect(hasPermissionStub).to.have.been.calledOnceWithExactly(sinon.match.string, 'admin:access');
    });
  });
});