import { expect, sandbox } from '../mocha.setup';
import winston from 'winston';
import { createLogger, LogLevel } from '../../server/utils/logger';

describe('Logger', () => {
  let mockConsoleTransport: any;
  let mockLogger: any;
  let mockFormat: any;

  beforeEach(() => {
    sandbox.restore();
    mockConsoleTransport = sandbox.stub().returns({});
    mockFormat = {
      colorize: sandbox.stub().returnsThis(),
      simple: sandbox.stub().returnsThis(),
      json: sandbox.stub().returnsThis(),
      timestamp: sandbox.stub().returnsThis(),
      combine: sandbox.stub().returnsThis()
    };
    mockLogger = sandbox.stub().returns({
      error: sandbox.stub(),
      warn: sandbox.stub(),
      info: sandbox.stub(),
      http: sandbox.stub(),
      debug: sandbox.stub(),
      log: sandbox.stub()
    });

    // Mock winston
    const mockWinston = {
      transports: { Console: mockConsoleTransport },
      format: mockFormat,
      createLogger: mockLogger
    };
    sandbox.stub(winston, 'transports').value(mockWinston.transports);
    sandbox.stub(winston, 'format').value(mockFormat);
    sandbox.stub(winston, 'createLogger').value(mockLogger);
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('createLogger', () => {
    it('should create logger with default options', () => {
      createLogger();
      expect(mockLogger.called).to.be.true;
      expect(mockConsoleTransport.called).to.be.true;
      
      const consoleCall = mockConsoleTransport.getCall(0);
      expect(consoleCall.args[0]).to.have.property('format');
    });

    it('should create logger with custom options', () => {
      const options = {
        level: 'debug' as LogLevel,
        logDirectory: 'custom-logs',
        maxFiles: '7d'
      };
      createLogger(options);
      expect(mockLogger.calledOnce).to.be.true;
      const call = mockLogger.getCall(0);
      expect(call.args[0]).to.have.property('level', options.level);
    });
  });
});
