jest.unmock('@src/services/common/sendFile');

import { sendFile, sendFileProvider, type SendFile } from '@src/services/common/sendFile';
import type { Response } from '@src/types';
import { getPathUtilsMock, getJimpexMock } from '@tests/mocks';

describe('services/common:sendFile', () => {
  describe('function', () => {
    it('should create a function to send a file on a server response', () => {
      // Given
      const { pathUtils } = getPathUtilsMock();
      let sut = null;
      // When
      sut = sendFile({ inject: { pathUtils } });
      // Then
      expect(sut).toEqual(expect.any(Function));
    });

    it('should send a file on a server response', () => {
      // Given
      const file = 'index.html';
      const { pathUtils, pathUtilsMocks } = getPathUtilsMock();
      const response = {
        sendFile: jest.fn((_, callback) => callback()),
        end: jest.fn(),
      } as unknown as Response;
      // When
      sendFile({ inject: { pathUtils } })({
        res: response,
        filepath: file,
      });
      // Then
      expect(pathUtilsMocks.joinFrom).toHaveBeenCalledTimes(1);
      expect(pathUtilsMocks.joinFrom).toHaveBeenCalledWith('app', file);
      expect(response.sendFile).toHaveBeenCalledTimes(1);
      expect(response.sendFile).toHaveBeenCalledWith(file, expect.any(Function));
      expect(response.end).toHaveBeenCalledTimes(1);
    });

    it('should send a file on a server response, with a custom location', () => {
      // Given
      const file = 'index.html';
      const { pathUtils, pathUtilsMocks } = getPathUtilsMock();
      const response = {
        sendFile: jest.fn((_, callback) => callback()),
        end: jest.fn(),
      } as unknown as Response;
      const location = 'home';
      // When
      sendFile({ inject: { pathUtils } })({
        res: response,
        filepath: file,
        from: location,
      });
      // Then
      expect(pathUtilsMocks.joinFrom).toHaveBeenCalledTimes(1);
      expect(pathUtilsMocks.joinFrom).toHaveBeenCalledWith(location, file);
    });

    it('should send an error if the response fails while sending a file', () => {
      // Given
      const error = new Error('Unknown error');
      const file = 'index.html';
      const { pathUtils } = getPathUtilsMock();
      const response = {
        sendFile: jest.fn((_, callback) => callback(error)),
        end: jest.fn(),
      } as unknown as Response;
      const next = jest.fn();
      // When
      sendFile({ inject: { pathUtils } })({
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
      const { pathUtils } = getPathUtilsMock();
      const response = {
        sendFile: jest.fn((_, callback) => callback(error)),
        end: jest.fn(),
      } as unknown as Response;
      // When
      sendFile({ inject: { pathUtils } })({
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
      const { container, containerMocks } = getJimpexMock();
      const { pathUtils } = getPathUtilsMock();
      // When
      sendFileProvider.register(container);
      const [[, lazy]] = containerMocks.set.mock.calls as [[string, () => SendFile]];
      const result = lazy();
      // Then
      expect(result.toString()).toBe(sendFile({ inject: { pathUtils } }).toString());
      expect(containerMocks.set).toHaveBeenCalledTimes(1);
      expect(containerMocks.set).toHaveBeenCalledWith('sendFile', expect.any(Function));
      expect(containerMocks.get).toHaveBeenCalledTimes(1);
      expect(containerMocks.get).toHaveBeenCalledWith('pathUtils');
    });
  });
});
