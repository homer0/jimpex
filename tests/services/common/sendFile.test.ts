jest.unmock('../../../src/services/common/sendFile');

import { PathUtils } from '@homer0/path-utils';
import { Jimpex } from '../../../src/app';
import {
  sendFile,
  sendFileProvider,
  type SendFile,
} from '../../../src/services/common/sendFile';
import type { Response } from '../../../src/types';

describe('services/common:sendFile', () => {
  describe('function', () => {
    it('should create a function to send a file on a server response', () => {
      // Given
      const pathUtils = new PathUtils();
      let sut = null;
      // When
      sut = sendFile(pathUtils);
      // Then
      expect(sut).toEqual(expect.any(Function));
    });

    it('should send a file on a server response', () => {
      // Given
      const file = 'index.html';
      const joinFrom = jest.fn();
      class MyPathUtils extends PathUtils {
        override joinFrom(from: string, filepath: string): string {
          joinFrom(from, filepath);
          return filepath;
        }
      }
      const pathUtils = new MyPathUtils();
      const response = {
        sendFile: jest.fn((_, callback) => callback()),
        end: jest.fn(),
      } as unknown as Response;
      // When
      sendFile(pathUtils)({
        res: response,
        filepath: file,
      });
      // Then
      expect(joinFrom).toHaveBeenCalledTimes(1);
      expect(joinFrom).toHaveBeenCalledWith('app', file);
      expect(response.sendFile).toHaveBeenCalledTimes(1);
      expect(response.sendFile).toHaveBeenCalledWith(file, expect.any(Function));
      expect(response.end).toHaveBeenCalledTimes(1);
    });

    it('should send a file on a server response, with a custom location', () => {
      // Given
      const file = 'index.html';
      const joinFrom = jest.fn();
      class MyPathUtils extends PathUtils {
        override joinFrom(from: string, filepath: string): string {
          joinFrom(from, filepath);
          return filepath;
        }
      }
      const pathUtils = new MyPathUtils();
      const response = {
        sendFile: jest.fn((_, callback) => callback()),
        end: jest.fn(),
      } as unknown as Response;
      const location = 'home';
      // When
      sendFile(pathUtils)({
        res: response,
        filepath: file,
        from: location,
      });
      // Then
      expect(joinFrom).toHaveBeenCalledTimes(1);
      expect(joinFrom).toHaveBeenCalledWith(location, file);
    });

    it('should send an error if the response fails while sending a file', () => {
      // Given
      const error = new Error('Unknown error');
      const file = 'index.html';
      class MyPathUtils extends PathUtils {
        override joinFrom(_: string, filepath: string): string {
          return filepath;
        }
      }
      const pathUtils = new MyPathUtils();
      const response = {
        sendFile: jest.fn((_, callback) => callback(error)),
        end: jest.fn(),
      } as unknown as Response;
      const next = jest.fn();
      // When
      sendFile(pathUtils)({
        res: response,
        filepath: file,
        next,
      });
      // Then
      expect(next).toHaveBeenCalledTimes(1);
      expect(next).toHaveBeenCalledWith(error);
      expect(response.end).toHaveBeenCalledTimes(0);
    });

    it('should fail silently if the response fails to send the file and `next` is not sent', () => {
      // Given
      const error = new Error('Unknown error');
      const file = 'index.html';
      class MyPathUtils extends PathUtils {
        override joinFrom(_: string, filepath: string): string {
          return filepath;
        }
      }
      const pathUtils = new MyPathUtils();
      const response = {
        sendFile: jest.fn((_, callback) => callback(error)),
        end: jest.fn(),
      } as unknown as Response;
      // When
      sendFile(pathUtils)({
        res: response,
        filepath: file,
      });
      // Then
      expect(response.sendFile).toHaveBeenCalledTimes(1);
      expect(response.sendFile).toHaveBeenCalledWith(file, expect.any(Function));
      expect(response.end).toHaveBeenCalledTimes(0);
    });
  });

  describe('provider', () => {
    it('should register the function', () => {
      // Given
      const setFn = jest.fn();
      const getFn = jest.fn();
      class Container extends Jimpex {
        override set(...args: Parameters<Jimpex['set']>): ReturnType<Jimpex['set']> {
          setFn(...args);
          return super.set(...args);
        }
        override get<T = unknown>(name: string): T {
          getFn(name);
          return super.get(name);
        }
      }
      const container = new Container();
      // When
      sendFileProvider.register(container);
      const [[, lazy]] = setFn.mock.calls as [[string, () => SendFile]];
      const result = lazy();
      // Then
      expect(result.toString()).toBe(sendFile(new PathUtils()).toString());
      expect(setFn).toHaveBeenCalledTimes(1);
      expect(setFn).toHaveBeenCalledWith('sendFile', expect.any(Function));
      expect(getFn).toHaveBeenCalledTimes(1);
      expect(getFn).toHaveBeenCalledWith('pathUtils');
    });
  });
});
