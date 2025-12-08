import { vi, type Mock } from 'vitest';
import { SimpleLogger } from '@homer0/simple-logger';

export type LoggerMockMocks = {
  success: Mock<(...args: Parameters<SimpleLogger['success']>) => void>;
  info: Mock<(...args: Parameters<SimpleLogger['info']>) => void>;
  warn: Mock<(...args: Parameters<SimpleLogger['warn']>) => void>;
  error: Mock<(...args: Parameters<SimpleLogger['error']>) => void>;
};

export type LoggerMockResult = {
  logger: SimpleLogger;
  loggerMocks: LoggerMockMocks;
};

export const getLoggerMock = (): LoggerMockResult => {
  const mocks = {
    success: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
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
