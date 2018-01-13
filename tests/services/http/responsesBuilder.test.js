const JimpleMock = require('/tests/mocks/jimple.mock');

jest.mock('jimple', () => JimpleMock);
jest.unmock('/src/utils/wrappers');
jest.unmock('/src/services/http/responsesBuilder');

require('jasmine-expect');
const statuses = require('statuses');
const {
  ResponsesBuilder,
  responsesBuilder,
} = require('/src/services/http/responsesBuilder');

describe('services/http:responsesBuilder', () => {
  it('should be instantiated with all its dependencies', () => {
    // Given
    const appConfiguration = 'appConfiguration';
    let sut = null;
    // When
    sut = new ResponsesBuilder(appConfiguration);
    // Then
    expect(sut).toBeInstanceOf(ResponsesBuilder);
    expect(sut.appConfiguration).toBe(appConfiguration);
  });

  it('should generate and send a basic JSON response', () => {
    // Given
    const version = 'latest';
    const appConfiguration = {
      get: jest.fn(() => version),
    };
    const response = {
      status: jest.fn(() => response),
      json: jest.fn(() => response),
      end: jest.fn(() => response),
    };
    const data = {
      dataProp: 'dataValue',
    };
    let sut = null;
    const expectedResponse = {
      metadata: {
        version,
        status: statuses.ok,
      },
      data,
    };
    // When
    sut = new ResponsesBuilder(appConfiguration);
    sut.json(response, data);
    // Then
    expect(response.status).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(statuses.ok);
    expect(response.json).toHaveBeenCalledTimes(1);
    expect(response.json).toHaveBeenCalledWith(expectedResponse);
    expect(response.end).toHaveBeenCalledTimes(1);
  });

  it('should generate and send a JSON response with custom status and metadata', () => {
    // Given
    const version = 'latest';
    const metadata = {
      date: '25-09-2015',
    };
    const status = 409;
    const appConfiguration = {
      get: jest.fn(() => version),
    };
    const response = {
      status: jest.fn(() => response),
      json: jest.fn(() => response),
      end: jest.fn(() => response),
    };
    const data = {
      dataProp: 'dataValue',
    };
    let sut = null;
    const expectedResponse = {
      metadata: Object.assign({
        version,
        status,
      }, metadata),
      data,
    };
    // When
    sut = new ResponsesBuilder(appConfiguration);
    sut.json(response, data, status, metadata);
    // Then
    expect(response.status).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.json).toHaveBeenCalledTimes(1);
    expect(response.json).toHaveBeenCalledWith(expectedResponse);
    expect(response.end).toHaveBeenCalledTimes(1);
  });

  it('should generate and send an HTML response that fires a post message', () => {
    // Given
    const title = 'My HTML';
    const message = 'the-message';
    const appConfiguration = {
      version: 'latest',
      postMessagesPrefix: 'prefix',
      get: jest.fn((prop) => appConfiguration[prop]),
    };
    const response = {
      setHeader: jest.fn(),
      status: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
    let sut = null;
    let html = null;
    const expectedHeaders = [
      ['Content-Type', 'text/html'],
      ['Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store'],
    ];
    const expectedMessage = `${appConfiguration.postMessagesPrefix}${message}`;
    // When
    sut = new ResponsesBuilder(appConfiguration);
    sut.htmlPostMessage(response, title, message);
    [[html]] = response.write.mock.calls;
    // Then
    expect(response.setHeader).toHaveBeenCalledTimes(expectedHeaders.length);
    expectedHeaders.forEach((headerCall) => {
      expect(response.setHeader).toHaveBeenCalledWith(...headerCall);
    });
    expect(response.status).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(statuses.ok);
    expect(response.write).toHaveBeenCalledTimes(1);
    expect(response.write).toHaveBeenCalledWith(expect.any(String));
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(html).toMatch(RegExp(`<title>${title}</title>`));
    expect(html).toMatch(RegExp(`\\.postMessage\\('${expectedMessage}', '\\*'\\)`));
  });

  it('should generated a customized HTML for the post message response', () => {
    // Given
    const title = 'My HTML';
    const message = 'the-message';
    const appConfiguration = {
      version: 'latest',
      postMessagesPrefix: '',
      get: jest.fn((prop) => appConfiguration[prop]),
    };
    const response = {
      setHeader: jest.fn(),
      status: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
    };
    const status = 409;
    const options = {
      target: 'windowTarget',
      close: false,
      closeDelay: 300,
    };
    let sut = null;
    let html = null;
    const expectedHeaders = [
      ['Content-Type', 'text/html'],
      ['Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store'],
    ];
    // When
    sut = new ResponsesBuilder(appConfiguration);
    sut.htmlPostMessage(response, title, message, status, options);
    [[html]] = response.write.mock.calls;
    // Then
    expect(response.setHeader).toHaveBeenCalledTimes(expectedHeaders.length);
    expectedHeaders.forEach((headerCall) => {
      expect(response.setHeader).toHaveBeenCalledWith(...headerCall);
    });
    expect(response.status).toHaveBeenCalledTimes(1);
    expect(response.status).toHaveBeenCalledWith(status);
    expect(response.write).toHaveBeenCalledTimes(1);
    expect(response.write).toHaveBeenCalledWith(expect.any(String));
    expect(response.end).toHaveBeenCalledTimes(1);
    expect(html).toMatch(RegExp(`<title>${title}</title>`));
    expect(html).toMatch(RegExp(`${options.target}\\.postMessage\\('${message}', '\\*'\\)`));
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
    responsesBuilder(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    sut = serviceFn();
    // Then
    expect(serviceName).toBe('responsesBuilder');
    expect(sut).toBeInstanceOf(ResponsesBuilder);
    expect(sut.appConfiguration).toBe('appConfiguration');
  });
});
