import { expect, sandbox } from '../mocha.setup';
import { Request, Response, NextFunction } from 'express';
import { Logger } from 'winston';
import { createRequestLogger, RequestLoggerOptions } from '../../server/middleware/request-logger';
import sinon from 'sinon';

describe('Request Logger Middleware', () => {
  let mockLogger: Partial<Logger>;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    // Create mock logger
    mockLogger = {
      info: sandbox.stub(),
      warn: sandbox.stub(),
      error: sandbox.stub()
    };

    // Create mock request
    mockReq = {
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
      headers: {},
      query: {},
      body: {}
    };

    // Create mock response with EventEmitter functionality
    mockRes = {
      statusCode: 200,
      on: sandbox.stub().callsFake((event, callback) => {
        if (event === 'finish') {
          callback();
        }
      })
    };

    // Create mock next function
    mockNext = sandbox.stub();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it('should log basic request information', () => {
    const middleware = createRequestLogger(mockLogger as Logger);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.info).to.have.been.calledWith('Incoming request', {
      requestId: sinon.match.string,
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1'
    });

    expect(mockNext).to.have.been.called;
  });

  it('should skip logging for excluded paths', () => {
    const middleware = createRequestLogger(mockLogger as Logger, {
      excludePaths: ['/test']
    });

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.info).to.not.have.been.called;
    expect(mockNext).to.have.been.called;
  });

  it('should log query parameters when enabled', () => {
    const middleware = createRequestLogger(mockLogger as Logger, {
      logQuery: true
    });

    mockReq.query = { foo: 'bar' };
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.info).to.have.been.calledWith('Incoming request', {
      requestId: sinon.match.string,
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
      query: { foo: 'bar' }
    });
  });

  it('should redact sensitive headers', () => {
    const middleware = createRequestLogger(mockLogger as Logger, {
      logHeaders: true,
      sensitiveHeaders: ['authorization']
    });

    mockReq.headers = {
      authorization: 'Bearer token',
      'content-type': 'application/json'
    };

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.info).to.have.been.calledWith('Incoming request', {
      requestId: sinon.match.string,
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
      headers: {
        authorization: '[REDACTED]',
        'content-type': 'application/json'
      }
    });
  });

  it('should log response information', () => {
    const middleware = createRequestLogger(mockLogger as Logger);
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.info).to.have.been.calledWith('Request completed', {
      requestId: sinon.match.string,
      statusCode: 200,
      duration: sinon.match.number
    });
  });

  it('should log warning for error responses', () => {
    const middleware = createRequestLogger(mockLogger as Logger);
    mockRes.statusCode = 500;

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.warn).to.have.been.calledWith('Request error', {
      requestId: sinon.match.string,
      statusCode: 500,
      duration: sinon.match.number
    });
  });

  it('should include request body when enabled', () => {
    const middleware = createRequestLogger(mockLogger as Logger, {
      logBody: true
    });

    mockReq.body = { data: 'test' };
    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockLogger.info).to.have.been.calledWith('Incoming request', {
      requestId: sinon.match.string,
      method: 'GET',
      path: '/test',
      ip: '127.0.0.1',
      body: { data: 'test' }
    });
  });
});
