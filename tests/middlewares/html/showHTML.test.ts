import { vi, describe, it, expect } from 'vitest';
import {
  ShowHTML,
  showHTMLMiddleware,
  type ShowHTMLConstructorOptions,
} from '@src/middlewares/html/showHTML.js';
import type { HTMLGenerator, SendFile } from '@src/services/index.js';
import type { AsyncExpressMiddleware, Request, Response } from '@src/types/index.js';
import { getJimpexMock } from '@tests/mocks/index.js';

describe('middlewares/html:showHTML', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const options: ShowHTMLConstructorOptions = {
        inject: {
          sendFile: (() => {}) as SendFile,
        },
      };
      // When
      const sut = new ShowHTML(options);
      // Then
      expect(sut).toBeInstanceOf(ShowHTML);
      expect(sut.options).toEqual({
        file: 'index.html',
      });
    });

    it('should be instantiated with custom options', () => {
      // Given
      const options: ShowHTMLConstructorOptions = {
        inject: {
          sendFile: (() => {}) as SendFile,
        },
        file: 'charo.html',
      };
      // When
      const sut = new ShowHTML(options);
      // Then
      expect(sut).toBeInstanceOf(ShowHTML);
      expect(sut.options).toEqual({
        file: options.file,
      });
    });

    describe('middleware', () => {
      it('should serve an HTML file', async () => {
        // Given
        const sendFile = vi.fn();
        const options: ShowHTMLConstructorOptions = {
          inject: {
            sendFile: sendFile as SendFile,
          },
        };
        const setHeader = vi.fn();
        const response = {
          response: true,
          setHeader,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = () => {};
        // When
        const sut = new ShowHTML(options);
        await sut.getMiddleware()(request, response, next);
        // Then
        expect(sendFile).toHaveBeenCalledTimes(1);
        expect(sendFile).toHaveBeenCalledWith({
          res: response,
          next,
          filepath: 'index.html',
        });
        expect(setHeader).toHaveBeenCalledTimes(1);
        expect(setHeader).toHaveBeenCalledWith('Content-Type', 'text/html');
      });

      it('should serve an HTML file from the HTMLGenerator', async () => {
        // Given
        const sendFile = vi.fn();
        const htmlGeneratorFile = 'charo.html';
        const htmlGenerator = {
          whenReady: vi.fn(() => Promise.resolve()),
          options: {
            file: htmlGeneratorFile,
          },
        };
        const getHTMLGenerator = vi.fn(() => htmlGenerator as unknown as HTMLGenerator);
        const options: ShowHTMLConstructorOptions = {
          inject: {
            sendFile: sendFile as SendFile,
            getHTMLGenerator,
          },
        };
        const setHeader = vi.fn();
        const response = {
          response: true,
          setHeader,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = () => {};
        // When
        const sut = new ShowHTML(options);
        await sut.getMiddleware()(request, response, next);
        await sut.getMiddleware()(request, response, next);
        // Then
        expect(sut.options).toEqual({
          file: htmlGeneratorFile,
        });
        expect(sendFile).toHaveBeenCalledTimes(2);
        expect(sendFile).toHaveBeenNthCalledWith(1, {
          res: response,
          next,
          filepath: htmlGeneratorFile,
        });
        expect(sendFile).toHaveBeenNthCalledWith(2, {
          res: response,
          next,
          filepath: htmlGeneratorFile,
        });
        expect(getHTMLGenerator).toHaveBeenCalledTimes(1);
        expect(htmlGenerator.whenReady).toHaveBeenCalledTimes(1);
      });

      it('should fail serve an HTML file from the HTMLGenerator', async () => {
        // Given
        const sendFile = vi.fn();
        const htmlGeneratorError = new Error('htmlGeneratorError');
        const htmlGenerator = {
          whenReady: vi.fn(() => Promise.reject(htmlGeneratorError)),
        };
        const getHTMLGenerator = vi.fn(() => htmlGenerator as unknown as HTMLGenerator);
        const options: ShowHTMLConstructorOptions = {
          inject: {
            sendFile: sendFile as SendFile,
            getHTMLGenerator,
          },
        };
        const setHeader = vi.fn();
        const response = {
          response: true,
          setHeader,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = vi.fn();
        // When
        const sut = new ShowHTML(options);
        await sut.getMiddleware()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(htmlGeneratorError);
      });
    });
  });

  describe('middleware', () => {
    it('should configure it for the container and and serve an HTML file', async () => {
      // Given
      const sendFile = vi.fn();
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          sendFile,
        },
      });
      const setHeader = vi.fn();
      const response = {
        response: true,
        setHeader,
      } as unknown as Response;
      const request = {
        request: true,
      } as unknown as Request;
      const next = vi.fn();
      // When
      const sut = showHTMLMiddleware.connect(container);
      await (sut as AsyncExpressMiddleware)(request, response, next);
      // Then
      expect(mocks.set).toHaveBeenCalledTimes(0);
      expect(mocks.get).toHaveBeenCalledTimes(1);
      expect(mocks.get).toHaveBeenCalledWith('sendFile');
      expect(mocks.try).toHaveBeenCalledTimes(1);
      expect(mocks.try).toHaveBeenCalledWith('htmlGenerator');
      expect(sendFile).toHaveBeenCalledTimes(1);
      expect(sendFile).toHaveBeenCalledWith({
        res: response,
        next,
        filepath: 'index.html',
      });
    });

    it('should configure it for the container and use a custom htmlGenerator', async () => {
      // Given
      const sendFile = vi.fn();
      const htmlGeneratorFile = 'charo.html';
      const htmlGenerator = {
        whenReady: vi.fn(() => Promise.resolve()),
        options: {
          file: htmlGeneratorFile,
        },
      };
      const htmlGeneratorName = 'myHtmlGenerator';
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          sendFile,
          [htmlGeneratorName]: htmlGenerator,
        },
      });
      const setHeader = vi.fn();
      const response = {
        response: true,
        setHeader,
      } as unknown as Response;
      const request = {
        request: true,
      } as unknown as Request;
      const next = vi.fn();
      // When
      const sut = showHTMLMiddleware({
        htmlGeneratorServiceName: htmlGeneratorName,
      }).connect(container);
      await (sut as AsyncExpressMiddleware)(request, response, next);
      // Then
      expect(mocks.try).toHaveBeenCalledTimes(1);
      expect(mocks.try).toHaveBeenCalledWith(htmlGeneratorName);
      expect(htmlGenerator.whenReady).toHaveBeenCalledTimes(1);
      expect(sendFile).toHaveBeenCalledTimes(1);
      expect(sendFile).toHaveBeenCalledWith({
        res: response,
        next,
        filepath: htmlGeneratorFile,
      });
    });
  });
});
