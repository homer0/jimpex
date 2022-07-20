jest.unmock('@src/services/frontend/frontendFs');

import fs from 'fs/promises';
import { FrontendFs, frontendFsProvider } from '@src/services/frontend/frontendFs';
import { getPathUtilsMock, getJimpexMock } from '@tests/mocks';

describe('services/frontend:frontendFs', () => {
  describe('class', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should be instantiated', () => {
      // Given
      const { pathUtils } = getPathUtilsMock();
      // When
      const sut = new FrontendFs(pathUtils);
      // Then
      expect(sut).toBeInstanceOf(FrontendFs);
    });

    it('should read a file', async () => {
      // Given
      const filepath = 'file.html';
      const contents = '<strong>content</strong>';
      jest.spyOn(fs, 'readFile').mockResolvedValueOnce(contents);
      const { pathUtils, pathUtilsMocks } = getPathUtilsMock();
      // When
      const sut = new FrontendFs(pathUtils);
      const result = await sut.read(filepath);
      // Then
      expect(result).toBe(contents);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(filepath, 'utf-8');
      expect(pathUtilsMocks.joinFrom).toHaveBeenCalledTimes(1);
      expect(pathUtilsMocks.joinFrom).toHaveBeenCalledWith('app', filepath);
    });

    it('should read a file with custom encoding', async () => {
      // Given
      const filepath = 'file.html';
      const contents = '<strong>content</strong>';
      const encoding = 'utf16le';
      jest.spyOn(fs, 'readFile').mockResolvedValueOnce(contents);
      const { pathUtils } = getPathUtilsMock();
      // When
      const sut = new FrontendFs(pathUtils);
      const result = await sut.read(filepath, encoding);
      // Then
      expect(result).toBe(contents);
      expect(fs.readFile).toHaveBeenCalledTimes(1);
      expect(fs.readFile).toHaveBeenCalledWith(filepath, encoding);
    });

    it('should write on a file', async () => {
      // Given
      const filepath = 'file.html';
      const contents = '<strong>content</strong>';
      jest.spyOn(fs, 'writeFile').mockResolvedValueOnce();
      const { pathUtils, pathUtilsMocks } = getPathUtilsMock();
      // When
      const sut = new FrontendFs(pathUtils);
      await sut.write(filepath, contents);
      // Then
      expect(fs.writeFile).toHaveBeenCalledTimes(1);
      expect(fs.writeFile).toHaveBeenCalledWith(filepath, contents);
      expect(pathUtilsMocks.joinFrom).toHaveBeenCalledTimes(1);
      expect(pathUtilsMocks.joinFrom).toHaveBeenCalledWith('app', filepath);
    });

    it('should delete a file', async () => {
      // Given
      const filepath = 'file.html';
      jest.spyOn(fs, 'unlink').mockResolvedValueOnce();
      const { pathUtils, pathUtilsMocks } = getPathUtilsMock();
      // When
      const sut = new FrontendFs(pathUtils);
      await sut.delete(filepath);
      // Then
      expect(fs.unlink).toHaveBeenCalledTimes(1);
      expect(fs.unlink).toHaveBeenCalledWith(filepath);
      expect(pathUtilsMocks.joinFrom).toHaveBeenCalledTimes(1);
      expect(pathUtilsMocks.joinFrom).toHaveBeenCalledWith('app', filepath);
    });
  });

  describe('provider', () => {
    it('should register the function', () => {
      // Given
      const { container, containerMocks: mocks } = getJimpexMock();
      // When
      frontendFsProvider.register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => FrontendFs]];
      const result = lazy();
      // Then
      expect(result).toBeInstanceOf(FrontendFs);
      expect(mocks.set).toHaveBeenCalledTimes(1);
      expect(mocks.set).toHaveBeenCalledWith('frontendFs', expect.any(Function));
      expect(mocks.get).toHaveBeenCalledTimes(1);
      expect(mocks.get).toHaveBeenCalledWith('pathUtils');
    });
  });
});
