import { expect } from 'chai';
import { describe, it, beforeEach, afterEach } from 'mocha';
import sinon from 'sinon';
import { PrismaClient } from '@prisma/client';
import { SandboxService } from '../../services/sandbox';

describe('SandboxService', () => {
  let sandboxService: SandboxService;
  let prismaStub: sinon.SinonStubbedInstance<PrismaClient>;

  beforeEach(() => {
    prismaStub = {
      sandbox: {
        create: sinon.stub(),
        findUnique: sinon.stub(),
        update: sinon.stub(),
        delete: sinon.stub()
      }
    } as any;

    // @ts-ignore - Stub the PrismaClient constructor
    sinon.stub(PrismaClient.prototype, 'constructor').returns(prismaStub);
    sandboxService = new SandboxService();
  });

  afterEach(() => {
    sinon.restore();
  });

  describe('createSandbox', () => {
    it('should create a sandbox with default options', async () => {
      const mockSandboxId = '123';
      prismaStub.sandbox.create.resolves({ id: mockSandboxId });

      const result = await sandboxService.createSandbox();

      expect(prismaStub.sandbox.create).to.have.been.calledWith({
        data: {
          id: sinon.match.string,
          timeoutMs: 5000,
          memoryLimitMb: 512,
          allowedModules: [],
          environment: {},
          status: 'CREATED'
        }
      });
      expect(result).to.be.a('string');
    });

    it('should create a sandbox with custom options', async () => {
      const options = {
        timeoutMs: 10000,
        memoryLimitMb: 1024,
        allowedModules: ['fs', 'path'],
        environment: { NODE_ENV: 'test' }
      };
      const mockSandboxId = '123';
      prismaStub.sandbox.create.resolves({ id: mockSandboxId });

      const result = await sandboxService.createSandbox(options);

      expect(prismaStub.sandbox.create).to.have.been.calledWith({
        data: {
          id: sinon.match.string,
          ...options,
          status: 'CREATED'
        }
      });
      expect(result).to.be.a('string');
    });
  });

  describe('executeSandbox', () => {
    it('should execute code in sandbox successfully', async () => {
      const sandboxId = '123';
      const code = 'console.log("Hello, World!");';
      prismaStub.sandbox.findUnique.resolves({
        id: sandboxId,
        timeoutMs: 5000,
        environment: {}
      });
      prismaStub.sandbox.update.resolves({});

      const result = await sandboxService.executeSandbox(sandboxId, code);

      expect(result.success).to.be.true;
      expect(result.output).to.equal('Hello, World!');
      expect(result.error).to.be.undefined;
      expect(result.executionTimeMs).to.be.a('number');
      expect(result.memoryUsageMb).to.be.a('number');
      expect(prismaStub.sandbox.update).to.have.been.calledWith({
        where: { id: sandboxId },
        data: {
          status: 'COMPLETED',
          lastExecutionTime: sinon.match.date,
          lastExecutionDurationMs: sinon.match.number
        }
      });
    });

    it('should handle syntax errors in code', async () => {
      const sandboxId = '123';
      const code = 'console.log("Hello, World!"';  // Missing closing parenthesis
      prismaStub.sandbox.findUnique.resolves({
        id: sandboxId,
        timeoutMs: 5000,
        environment: {}
      });
      prismaStub.sandbox.update.resolves({});

      const result = await sandboxService.executeSandbox(sandboxId, code);

      expect(result.success).to.be.false;
      expect(result.error).to.be.a('string');
      expect(prismaStub.sandbox.update).to.have.been.calledWith({
        where: { id: sandboxId },
        data: {
          status: 'FAILED',
          lastExecutionTime: sinon.match.date,
          lastExecutionDurationMs: sinon.match.number
        }
      });
    });

    it('should handle sandbox not found', async () => {
      const sandboxId = '123';
      const code = 'console.log("Hello, World!");';
      prismaStub.sandbox.findUnique.resolves(null);

      try {
        await sandboxService.executeSandbox(sandboxId, code);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal(`Sandbox ${sandboxId} not found`);
      }
    });

    it('should respect timeout limit', async () => {
      const sandboxId = '123';
      const code = 'while(true) {}';  // Infinite loop
      prismaStub.sandbox.findUnique.resolves({
        id: sandboxId,
        timeoutMs: 100,  // Short timeout
        environment: {}
      });
      prismaStub.sandbox.update.resolves({});

      const result = await sandboxService.executeSandbox(sandboxId, code);

      expect(result.success).to.be.false;
      expect(result.error).to.include('timeout');
      expect(prismaStub.sandbox.update).to.have.been.calledWith({
        where: { id: sandboxId },
        data: {
          status: 'FAILED',
          lastExecutionTime: sinon.match.date,
          lastExecutionDurationMs: sinon.match.number
        }
      });
    });
  });

  describe('deleteSandbox', () => {
    it('should delete a sandbox', async () => {
      const sandboxId = '123';
      prismaStub.sandbox.delete.resolves({});

      await sandboxService.deleteSandbox(sandboxId);

      expect(prismaStub.sandbox.delete).to.have.been.calledWith({
        where: { id: sandboxId }
      });
    });

    it('should handle deleting non-existent sandbox', async () => {
      const sandboxId = '123';
      prismaStub.sandbox.delete.rejects(new Error('Sandbox not found'));

      try {
        await sandboxService.deleteSandbox(sandboxId);
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error).to.be.instanceOf(Error);
        expect(error.message).to.equal('Sandbox not found');
      }
    });
  });
});
