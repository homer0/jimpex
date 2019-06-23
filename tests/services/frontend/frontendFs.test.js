jest.mock('fs-extra');
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/frontend/frontendFs');

require('jasmine-expect');
const fs = require('fs-extra');
const {
  FrontendFs,
  frontendFs,
} = require('/src/services/frontend/frontendFs');

describe('services/frontend:frontendFs', () => {
  beforeEach(() => {
    fs.readFile.mockReset();
    fs.writeFile.mockReset();
    fs.unlink.mockReset();
  });

  it('should be instantiated with all its dependencies', () => {
    // Given
    const pathUtils = 'pathUtils';
    let sut = null;
    // When
    sut = new FrontendFs(pathUtils);
    // Then
    expect(sut).toBeInstanceOf(FrontendFs);
    expect(sut.pathUtils).toBe(pathUtils);
  });

  it('should read a file', () => {
    // Given
    const filepath = 'file.html';
    const contents = '<strong>content</strong>';
    fs.readFile.mockImplementationOnce(() => contents);
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => rest),
    };
    let sut = null;
    let result = null;
    // When
    sut = new FrontendFs(pathUtils);
    result = sut.read(filepath);
    // Then
    expect(result).toBe(contents);
    expect(fs.readFile).toHaveBeenCalledTimes(1);
    expect(fs.readFile).toHaveBeenCalledWith(filepath, 'utf-8');
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('app', filepath);
  });

  it('should read a file with custom encoding', () => {
    // Given
    const filepath = 'file.html';
    const contents = '<strong>content</strong>';
    const encoding = 'utf-9';
    fs.readFile.mockImplementationOnce(() => contents);
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => rest),
    };
    let sut = null;
    let result = null;
    // When
    sut = new FrontendFs(pathUtils);
    result = sut.read(filepath, encoding);
    // Then
    expect(result).toBe(contents);
    expect(fs.readFile).toHaveBeenCalledTimes(1);
    expect(fs.readFile).toHaveBeenCalledWith(filepath, encoding);
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('app', filepath);
  });

  it('should write on a file', () => {
    // Given
    const filepath = 'file.html';
    const contents = '<strong>content</strong>';
    const message = 'done!';
    fs.writeFile.mockImplementationOnce(() => message);
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => rest),
    };
    let sut = null;
    let result = null;
    // When
    sut = new FrontendFs(pathUtils);
    result = sut.write(filepath, contents);
    // Then
    expect(result).toBe(message);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    expect(fs.writeFile).toHaveBeenCalledWith(filepath, contents);
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('app', filepath);
  });

  it('should delete a file', () => {
    // Given
    const filepath = 'file.html';
    const message = 'done!';
    fs.unlink.mockImplementationOnce(() => message);
    const pathUtils = {
      joinFrom: jest.fn((from, rest) => rest),
    };
    let sut = null;
    let result = null;
    // When
    sut = new FrontendFs(pathUtils);
    result = sut.delete(filepath);
    // Then
    expect(result).toBe(message);
    expect(fs.unlink).toHaveBeenCalledTimes(1);
    expect(fs.unlink).toHaveBeenCalledWith(filepath);
    expect(pathUtils.joinFrom).toHaveBeenCalledTimes(1);
    expect(pathUtils.joinFrom).toHaveBeenCalledWith('app', filepath);
  });

  it('should include a provider for the DIC', () => {
    // Given
    const app = {
      set: jest.fn(),
      get: jest.fn((service) => service),
    };
    let sut = null;
    let serviceName = null;
    let serviceFn = null;
    // When
    frontendFs.register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('frontendFs');
    expect(sut).toBeInstanceOf(FrontendFs);
    expect(sut.pathUtils).toBe('pathUtils');
  });
});
