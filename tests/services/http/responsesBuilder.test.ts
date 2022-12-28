jest.unmock('@src/services/http/responsesBuilder');

import {
  ResponsesBuilder,
  responsesBuilderProvider,
  type ResponsesBuilderConstructorOptions,
} from '@src/services/http/responsesBuilder';
import type { Response } from '@src/types';
import type { Statuses } from '@src/utils/fns/statuses';
import { getJimpexMock, getConfigMock } from '@tests/mocks';

describe('services/http:responsesBuilder', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const { config } = getConfigMock();
      const statuses = jest.fn();
      const options: ResponsesBuilderConstructorOptions = {
        inject: {
          config,
          statuses: statuses as unknown as Statuses,
        },
      };
      // When
      const sut = new ResponsesBuilder(options);
      // Then
      expect(sut).toBeInstanceOf(ResponsesBuilder);
    });

    describe('htmlPostMessage', () => {
      it('should generate an HTML that posts a message', () => {
        // Given
        const title = 'My HTML';
        const message = 'the-message';
        const response = {
          setHeader: jest.fn(),
          status: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };
        const { config, configMocks } = getConfigMock();
        const postMessagesPrefix = 'prefix';
        configMocks.get.mockReturnValueOnce(postMessagesPrefix);
        const status = 200;
        const statuses = jest.fn(() => status);
        const options: ResponsesBuilderConstructorOptions = {
          inject: {
            config,
            statuses: statuses as unknown as Statuses,
          },
        };
        const expectedMessage = `${postMessagesPrefix}${message}`;
        // When
        const sut = new ResponsesBuilder(options);
        sut.htmlPostMessage({
          res: response as unknown as Response,
          title,
          message,
        });
        const [[html]] = response.write.mock.calls as [[string]];
        // Then
        expect(statuses).toHaveBeenCalledTimes(1);
        expect(statuses).toHaveBeenCalledWith('OK');
        expect(response.setHeader).toHaveBeenCalledTimes(2);
        expect(response.setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
        expect(response.setHeader).toHaveBeenCalledWith(
          'Cache-Control',
          'no-cache, max-age=0, must-revalidate, no-store',
        );
        expect(response.status).toHaveBeenCalledTimes(1);
        expect(response.status).toHaveBeenCalledWith(status);
        expect(response.write).toHaveBeenCalledTimes(1);
        expect(response.write).toHaveBeenCalledWith(expect.any(String));
        expect(response.end).toHaveBeenCalledTimes(1);
        expect(html).toContain(`<title>${title}</title>`);
        expect(html).toContain(`.postMessage('${expectedMessage}', '*')`);
        expect(html).toMatch(/setTimeout\(function\(\) \{ window\.close\(\); \}, \d+\)/);
      });

      it('should generate an HTML that closes the window after 30sec', () => {
        // Given
        const title = 'My HTML';
        const message = 'the-message';
        const closeDelay = 30000;
        const response = {
          setHeader: jest.fn(),
          status: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };
        const { config } = getConfigMock();
        const status = 200;
        const statuses = jest.fn(() => status);
        const options: ResponsesBuilderConstructorOptions = {
          inject: {
            config,
            statuses: statuses as unknown as Statuses,
          },
        };
        // When
        const sut = new ResponsesBuilder(options);
        sut.htmlPostMessage({
          res: response as unknown as Response,
          title,
          message,
          closeDelay,
        });
        const [[html]] = response.write.mock.calls as [[string]];
        // Then
        expect(html).toContain(
          `setTimeout(function() { window.close(); }, ${closeDelay})`,
        );
      });

      it("should generate an HTML that won't close the window", () => {
        // Given
        const title = 'My HTML';
        const message = 'the-message';
        const response = {
          setHeader: jest.fn(),
          status: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };
        const { config } = getConfigMock();
        const status = 200;
        const statuses = jest.fn(() => status);
        const options: ResponsesBuilderConstructorOptions = {
          inject: {
            config,
            statuses: statuses as unknown as Statuses,
          },
        };
        // When
        const sut = new ResponsesBuilder(options);
        sut.htmlPostMessage({
          res: response as unknown as Response,
          title,
          message,
          close: false,
        });
        const [[html]] = response.write.mock.calls as [[string]];
        // Then
        expect(html).not.toContain(`setTimeout(function() { window.close(); }`);
      });

      it('should generate an HTML that posts a message with custom target and status', () => {
        // Given
        const title = 'My HTML';
        const message = 'the-message';
        const target = 'window.opener.parent';
        const response = {
          setHeader: jest.fn(),
          status: jest.fn(),
          write: jest.fn(),
          end: jest.fn(),
        };
        const { config, configMocks } = getConfigMock();
        configMocks.get.mockReturnValueOnce(undefined);
        const status = 409;
        const statuses = jest.fn();
        const options: ResponsesBuilderConstructorOptions = {
          inject: {
            config,
            statuses: statuses as unknown as Statuses,
          },
        };
        // When
        const sut = new ResponsesBuilder(options);
        sut.htmlPostMessage({
          res: response as unknown as Response,
          title,
          message,
          status,
          target,
        });
        const [[html]] = response.write.mock.calls as [[string]];
        // Then
        expect(statuses).toHaveBeenCalledTimes(0);
        expect(response.status).toHaveBeenCalledTimes(1);
        expect(response.status).toHaveBeenCalledWith(status);
        expect(html).toContain(`<title>${title}</title>`);
        expect(html).toContain(`${target}.postMessage('${message}', '*')`);
      });
    });

    describe('JSON', () => {
      it('should generate a JSON response', () => {
        // Given
        const data = {
          daughters: ['Charo', 'Pili'],
        };
        const response = {
          status: jest.fn(),
          json: jest.fn(),
          end: jest.fn(),
        };
        const version = 'development';
        const { config, configMocks } = getConfigMock();
        configMocks.get.mockReturnValueOnce(version);
        const status = 200;
        const statuses = jest.fn(() => status);
        const options: ResponsesBuilderConstructorOptions = {
          inject: {
            config,
            statuses: statuses as unknown as Statuses,
          },
        };
        // When
        const sut = new ResponsesBuilder(options);
        sut.json({
          res: response as unknown as Response,
          data,
        });
        // Then
        expect(statuses).toHaveBeenCalledTimes(1);
        expect(statuses).toHaveBeenCalledWith('OK');
        expect(response.status).toHaveBeenCalledTimes(1);
        expect(response.status).toHaveBeenCalledWith(status);
        expect(response.json).toHaveBeenCalledTimes(1);
        expect(response.json).toHaveBeenCalledWith({
          metadata: {
            version,
            status,
          },
          data,
        });
        expect(response.end).toHaveBeenCalledTimes(1);
      });

      it('should generate a JSON response with custom status and metadata', () => {
        // Given
        const data = {
          daughters: ['Charo', 'Pili'],
        };
        const metadata = {
          ages: [6, 3],
        };
        const response = {
          status: jest.fn(),
          json: jest.fn(),
          end: jest.fn(),
        };
        const version = 'development';
        const { config, configMocks } = getConfigMock();
        configMocks.get.mockReturnValueOnce(version);
        const status = 200;
        const statuses = jest.fn();
        const options: ResponsesBuilderConstructorOptions = {
          inject: {
            config,
            statuses: statuses as unknown as Statuses,
          },
        };
        // When
        const sut = new ResponsesBuilder(options);
        sut.json({
          res: response as unknown as Response,
          data,
          metadata,
          status,
        });
        // Then
        expect(statuses).toHaveBeenCalledTimes(0);
        expect(response.json).toHaveBeenCalledWith({
          metadata: {
            version,
            status,
            ...metadata,
          },
          data,
        });
      });

      it('should generate a JSON response using a string status', () => {
        // Given
        const data = {
          daughters: ['Charo', 'Pili'],
        };
        const response = {
          status: jest.fn(),
          json: jest.fn(),
          end: jest.fn(),
        };
        const version = 'development';
        const { config, configMocks } = getConfigMock();
        configMocks.get.mockReturnValueOnce(version);
        const status = 409;
        const statusName = 'conflict';
        const statuses = jest.fn(() => status);
        const options: ResponsesBuilderConstructorOptions = {
          inject: {
            config,
            statuses: statuses as unknown as Statuses,
          },
        };
        // When
        const sut = new ResponsesBuilder(options);
        sut.json({
          res: response as unknown as Response,
          data,
          status: statusName,
        });
        // Then
        expect(statuses).toHaveBeenCalledTimes(1);
        expect(statuses).toHaveBeenCalledWith(statusName);
        expect(response.json).toHaveBeenCalledTimes(1);
        expect(response.json).toHaveBeenCalledWith({
          metadata: {
            version,
            status,
          },
          data,
        });
      });
    });
  });

  describe('provider', () => {
    it('should register the service', () => {
      // Given
      const { container, containerMocks: mocks } = getJimpexMock();
      // When
      responsesBuilderProvider.register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => ResponsesBuilder]];
      const result = lazy();
      // Then
      expect(result).toBeInstanceOf(ResponsesBuilder);
      expect(mocks.set).toHaveBeenCalledTimes(1);
      expect(mocks.set).toHaveBeenCalledWith('responsesBuilder', expect.any(Function));
      expect(mocks.get).toHaveBeenCalledTimes(2);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'statuses');
    });
  });
});
