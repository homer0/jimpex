import { SimpleLogger } from '@homer0/simple-logger';

export type LoggerMockMocks = {
  success: jest.Mock<void, Parameters<SimpleLogger['success']>>;
  info: jest.Mock<void, Parameters<SimpleLogger['info']>>;
  warn: jest.Mock<void, Parameters<SimpleLogger['warn']>>;
  error: jest.Mock<void, Parameters<SimpleLogger['error']>>;
};

export type LoggerMockResult = {
  logger: SimpleLogger;
  loggerMocks: LoggerMockMocks;
};

export const getLoggerMock = (): LoggerMockResult => {
  const mocks = {
    success: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  class MockedLogger extends SimpleLogger {
    override success(...args: Parameters<SimpleLogger['success']>): void {
      mocks.success(...args);
    }
    override info(...args: Parameters<SimpleLogger['info']>): void {
      mocks.info(...args);
    }
    override warn(...args: Parameters<SimpleLogger['warn']>): void {
      mocks.warn(...args);
    }
    override error(...args: Parameters<SimpleLogger['error']>): void {
      mocks.error(...args);
    }
  }

  return {
    logger: new MockedLogger(),
    loggerMocks: mocks,
  };
};
