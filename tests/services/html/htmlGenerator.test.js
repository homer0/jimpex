jest.mock('wootils/shared', () => require('../../mocks/wootils.mock'));
jest.unmock('../../../src/utils/wrappers');
jest.unmock('../../../src/services/html/htmlGenerator');

const wootilsMock = require('../../mocks/wootils.mock');
const {
  HTMLGenerator,
  htmlGenerator,
} = require('../../../src/services/html/htmlGenerator');

describe('services/html:htmlGenerator', () => {
  beforeEach(() => {
    wootilsMock.reset();
  });

  it('should be instantiated', () => {
    // Given
    const appConfiguration = 'appConfiguration';
    const appLogger = 'appLogger';
    const frontendFs = 'frontendFs';
    let sut = null;
    // When
    sut = new HTMLGenerator(appConfiguration, appLogger, frontendFs);
    // Then
    expect(sut).toBeInstanceOf(HTMLGenerator);
    expect(sut.options).toEqual({
      template: expect.any(String),
      file: expect.any(String),
      deleteTemplateAfter: expect.any(Boolean),
      replacePlaceholder: expect.any(String),
      valuesExpression: expect.any(RegExp),
      variable: expect.any(String),
      configurationKeys: expect.any(Array),
    });
  });

  it('should be instantiated with a custom service to get the template values', () => {
    // Given
    const options = {};
    const appConfiguration = 'appConfiguration';
    const appLogger = 'appLogger';
    const frontendFs = 'frontendFs';
    const valuesService = {
      getValues: () => {},
    };
    let sut = null;
    // When
    sut = new HTMLGenerator(
      appConfiguration,
      appLogger,
      frontendFs,
      options,
      valuesService,
    );
    // Then
    expect(sut).toBeInstanceOf(HTMLGenerator);
  });

  it('should throw an error if the values service doesnt have a `getValues` method', () => {
    // Given
    const options = {};
    const appConfiguration = 'appConfiguration';
    const appLogger = 'appLogger';
    const frontendFs = 'frontendFs';
    const valuesService = {};
    // When/Then
    expect(
      () =>
        new HTMLGenerator(
          appConfiguration,
          appLogger,
          frontendFs,
          options,
          valuesService,
        ),
    ).toThrow(/The HTMLGenerator values service must have a `getValues` method/i);
  });

  it('should return the generated filename', () => {
    // Given
    const file = 'charito.html';
    const options = { file };
    const appConfiguration = 'appConfiguration';
    const appLogger = 'appLogger';
    const frontendFs = 'frontendFs';
    let sut = null;
    let result = null;
    // When
    sut = new HTMLGenerator(appConfiguration, appLogger, frontendFs, options);
    result = sut.getFile();
    // Then
    expect(result).toBe(file);
  });

  it('should return the values from the app configuration', async () => {
    // Given
    const options = {};
    const values = 'values';
    const appConfiguration = {
      get: jest.fn(() => values),
    };
    const appLogger = 'appLogger';
    const frontendFs = 'frontendFs';
    let sut = null;
    let result = null;
    // When
    sut = new HTMLGenerator(appConfiguration, appLogger, frontendFs, options);
    result = await sut.getValues();
    // Then
    expect(result).toBe(values);
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith(sut.options.configurationKeys);
  });

  it('should return the values from a service', async () => {
    // Given
    const options = {};
    const values = 'values';
    const appConfiguration = 'appConfiguration';
    const appLogger = 'appLogger';
    const frontendFs = 'frontendFs';
    const valuesService = {
      getValues: jest.fn(() => Promise.resolve(values)),
    };
    let sut = null;
    let result = null;
    // When
    sut = new HTMLGenerator(
      appConfiguration,
      appLogger,
      frontendFs,
      options,
      valuesService,
    );
    result = await sut.getValues();
    // Then
    expect(result).toBe(values);
    expect(valuesService.getValues).toHaveBeenCalledTimes(1);
  });

  it('should return an empty object as values', async () => {
    // Given
    const options = {
      configurationKeys: [],
    };
    const values = {};
    const appConfiguration = 'appConfiguration';
    const appLogger = 'appLogger';
    const frontendFs = 'frontendFs';
    let sut = null;
    let result = null;
    // When
    sut = new HTMLGenerator(appConfiguration, appLogger, frontendFs, options);
    result = await sut.getValues();
    // Then
    expect(result).toEqual(values);
  });

  it("should return a pending promise if the file hasn't been created", () => {
    // Given
    const options = {};
    const appConfiguration = 'appConfiguration';
    const appLogger = 'appLogger';
    const frontendFs = 'frontendFs';
    let sut = null;
    let result = null;
    // When
    sut = new HTMLGenerator(appConfiguration, appLogger, frontendFs, options);
    result = sut.whenReady();
    // Then
    expect(result).toBe('promise');
    expect(wootilsMock.deferred).toHaveBeenCalledTimes(1);
  });

  it('should generate the HTML file', async () => {
    // Given
    const placeholder = '{{placeholder}}';
    const options = {
      template: 'index.tpl.html',
      file: 'index.html',
      deleteTemplateAfter: false,
      replacePlaceholder: placeholder,
      variable: 'appConfiguration',
      configurationKeys: ['features'],
    };
    const values = {
      featureName: 'featureValue',
    };
    const appConfiguration = {
      get: jest.fn(() => values),
    };
    const appLogger = {
      success: jest.fn(),
    };
    const frontendFs = {
      read: jest.fn(() => Promise.resolve(placeholder)),
      write: jest.fn(() => Promise.resolve()),
    };
    let sut = null;
    const expectedContent = `window.${options.variable} = ${JSON.stringify(values)}`;
    // When
    sut = new HTMLGenerator(appConfiguration, appLogger, frontendFs, options);
    await sut.generateHTML();
    // Then
    expect(frontendFs.read).toHaveBeenCalledTimes(1);
    expect(frontendFs.read).toHaveBeenCalledWith(`./${options.template}`);
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith(options.configurationKeys);
    expect(frontendFs.write).toHaveBeenCalledTimes(1);
    expect(frontendFs.write).toHaveBeenCalledWith(options.file, expectedContent);
    expect(appLogger.success).toHaveBeenCalledTimes(1);
    expect(appLogger.success).toHaveBeenCalledWith(expect.any(String));
    expect(wootilsMock.mocks.deferredResolve).toHaveBeenCalledTimes(1);
    return sut.whenReady();
  });

  it('should generate the HTML file and replace values on the template', async () => {
    // Given
    const placeholder = '{{placeholder}}';
    const options = {
      template: 'index.tpl.html',
      file: 'index.html',
      deleteTemplateAfter: false,
      replacePlaceholder: placeholder,
      variable: 'appConfiguration',
      configurationKeys: ['features'],
    };
    const values = {
      featureName: {
        enabled: true,
        account: {
          id: 'XYZ',
        },
      },
      something: 'else',
    };
    const appConfiguration = {
      get: jest.fn(() => values),
    };
    const appLogger = {
      success: jest.fn(),
    };
    const template =
      `${placeholder};\n` +
      'const enabled = {{featureName.enabled}};\n' +
      'const unknown = {{unknownFeature}};\n' +
      "const id = '{{featureName.account.id}}';\n" +
      'const name = {{featureName.account.name}};\n' +
      "const something = '{{something}}';";
    const frontendFs = {
      read: jest.fn(() => Promise.resolve(template)),
      write: jest.fn(() => Promise.resolve()),
    };
    let sut = null;
    const expectedContent =
      `window.${options.variable} = ${JSON.stringify(values)};\n` +
      `const enabled = ${values.featureName.enabled};\n` +
      'const unknown = null;\n' +
      `const id = '${values.featureName.account.id}';\n` +
      'const name = null;\n' +
      `const something = '${values.something}';`;
    // When
    sut = new HTMLGenerator(appConfiguration, appLogger, frontendFs, options);
    await sut.generateHTML();
    // Then
    expect(frontendFs.read).toHaveBeenCalledTimes(1);
    expect(frontendFs.read).toHaveBeenCalledWith(`./${options.template}`);
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith(options.configurationKeys);
    expect(frontendFs.write).toHaveBeenCalledTimes(1);
    expect(frontendFs.write).toHaveBeenCalledWith(options.file, expectedContent);
    expect(appLogger.success).toHaveBeenCalledTimes(1);
    expect(appLogger.success).toHaveBeenCalledWith(expect.any(String));
    expect(wootilsMock.mocks.deferredResolve).toHaveBeenCalledTimes(1);
    return sut.whenReady();
  });

  it('should generate the HTML file and delete the template', async () => {
    // Given
    const placeholder = '{{placeholder}}';
    const options = {
      template: 'index.tpl.html',
      file: 'index.html',
      deleteTemplateAfter: true,
      replacePlaceholder: placeholder,
      variable: 'appConfiguration',
      configurationKeys: ['features'],
    };
    const values = {
      featureName: 'featureValue',
    };
    const appConfiguration = {
      get: jest.fn(() => values),
    };
    const appLogger = {
      success: jest.fn(),
      info: jest.fn(),
    };
    const frontendFs = {
      read: jest.fn(() => Promise.resolve(placeholder)),
      write: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
    };
    let sut = null;
    const expectedContent = `window.${options.variable} = ${JSON.stringify(values)}`;
    // When
    sut = new HTMLGenerator(appConfiguration, appLogger, frontendFs, options);
    await sut.generateHTML();
    // Then
    expect(frontendFs.read).toHaveBeenCalledTimes(1);
    expect(frontendFs.read).toHaveBeenCalledWith(`./${options.template}`);
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith(options.configurationKeys);
    expect(frontendFs.write).toHaveBeenCalledTimes(1);
    expect(frontendFs.write).toHaveBeenCalledWith(options.file, expectedContent);
    expect(appLogger.success).toHaveBeenCalledTimes(1);
    expect(appLogger.success).toHaveBeenCalledWith(expect.any(String));
    expect(frontendFs.delete).toHaveBeenCalledTimes(1);
    expect(frontendFs.delete).toHaveBeenCalledWith(`./${options.template}`);
    expect(appLogger.info).toHaveBeenCalledTimes(1);
    expect(appLogger.info).toHaveBeenCalledWith(expect.any(String));
    expect(wootilsMock.mocks.deferredResolve).toHaveBeenCalledTimes(1);
  });

  it('should fail to generate the HTML file', () => {
    // Given
    const options = {
      template: 'index.tpl.html',
    };
    const appConfiguration = 'appConfiguration';
    const appLogger = {
      error: jest.fn(),
    };
    const error = new Error('Unknown error');
    const frontendFs = {
      read: jest.fn(() => Promise.reject(error)),
    };
    let sut = null;
    // When
    sut = new HTMLGenerator(appConfiguration, appLogger, frontendFs, options);
    expect.assertions(5);
    return sut.generateHTML().catch((result) => {
      // Then
      expect(result).toBe(error);
      expect(frontendFs.read).toHaveBeenCalledTimes(1);
      expect(frontendFs.read).toHaveBeenCalledWith(`./${options.template}`);
      expect(appLogger.error).toHaveBeenCalledTimes(1);
      expect(appLogger.error).toHaveBeenCalledWith(expect.any(String));
    });
  });

  it('should register the generator to be executed when the server starts', async () => {
    // Given
    const appConfiguration = {
      get: jest.fn(() => {}),
    };
    const appLogger = {
      success: jest.fn(),
      info: jest.fn(),
    };
    const frontendFs = {
      read: jest.fn(() => Promise.resolve('')),
      write: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
    };
    const events = {
      once: jest.fn(),
    };
    let sut = null;
    const name = 'htmlGenerator';
    const services = {
      appConfiguration,
      appLogger,
      frontendFs,
      events,
    };
    const app = {
      set: jest.fn(),
      get: jest.fn((service) => (service === name ? sut : services[service])),
      try: jest.fn(() => null),
    };
    let serviceName = null;
    let serviceFn = null;
    let eventName = null;
    let eventFn = null;
    // When
    htmlGenerator.register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    [[eventName, eventFn]] = events.once.mock.calls;
    sut = serviceFn();
    await eventFn();
    // Then
    expect(serviceName).toBe(name);
    expect(eventName).toBe('after-start');
    expect(frontendFs.read).toHaveBeenCalledTimes(1);
    expect(frontendFs.read).toHaveBeenCalledWith(`./${sut.options.template}`);
    expect(appConfiguration.get).toHaveBeenCalledTimes(1);
    expect(appConfiguration.get).toHaveBeenCalledWith(sut.options.configurationKeys);
    expect(frontendFs.write).toHaveBeenCalledTimes(1);
    expect(frontendFs.write).toHaveBeenCalledWith(sut.options.file, expect.any(String));
    expect(frontendFs.delete).toHaveBeenCalledTimes(1);
    expect(frontendFs.delete).toHaveBeenCalledWith(`./${sut.options.template}`);
    expect(appLogger.success).toHaveBeenCalledTimes(1);
    expect(appLogger.success).toHaveBeenCalledWith(expect.any(String));
    expect(appLogger.info).toHaveBeenCalledTimes(1);
    expect(appLogger.info).toHaveBeenCalledWith(expect.any(String));
    expect(wootilsMock.mocks.deferredResolve).toHaveBeenCalledTimes(1);
    expect(app.try).toHaveBeenCalledTimes(1);
    expect(app.try).toHaveBeenCalledWith('htmlGeneratorValues');
  });

  it('should register the generator with a custom values service', async () => {
    // Given
    const appConfiguration = {
      get: jest.fn(() => {}),
    };
    const appLogger = {
      success: jest.fn(),
      info: jest.fn(),
    };
    const frontendFs = {
      read: jest.fn(() => Promise.resolve('')),
      write: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
    };
    const htmlGeneratorValues = {
      getValues: jest.fn(() => Promise.resolve({})),
    };
    const events = {
      once: jest.fn(),
    };
    let sut = null;
    const name = 'myHTMLGenerator';
    const services = {
      appConfiguration,
      appLogger,
      frontendFs,
      events,
      [name]: 'just-for-the-expect',
    };
    const app = {
      set: jest.fn(),
      get: jest.fn((service) => (service === name ? sut : services[service])),
      try: jest.fn(() => htmlGeneratorValues),
    };
    let serviceName = null;
    let serviceFn = null;
    let eventName = null;
    let eventFn = null;
    const expectedGets = Object.keys(services);
    const expectedEventName = 'after-start';
    // When
    htmlGenerator({
      serviceName: name,
    }).register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    [[eventName, eventFn]] = events.once.mock.calls;
    sut = serviceFn();
    await eventFn();
    // Then
    expect(serviceName).toBe(name);
    expect(eventName).toBe(expectedEventName);
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
    expect(app.set).toHaveBeenCalledTimes(1);
    expect(app.set).toHaveBeenCalledWith(name, expect.any(Function));
    expect(events.once).toHaveBeenCalledTimes(1);
    expect(events.once).toHaveBeenCalledWith(expectedEventName, expect.any(Function));
    expect(frontendFs.read).toHaveBeenCalledTimes(1);
    expect(frontendFs.read).toHaveBeenCalledWith(`./${sut.options.template}`);
    expect(frontendFs.write).toHaveBeenCalledTimes(1);
    expect(frontendFs.write).toHaveBeenCalledWith(sut.options.file, expect.any(String));
    expect(frontendFs.delete).toHaveBeenCalledTimes(1);
    expect(frontendFs.delete).toHaveBeenCalledWith(`./${sut.options.template}`);
    expect(appLogger.success).toHaveBeenCalledTimes(1);
    expect(appLogger.success).toHaveBeenCalledWith(expect.any(String));
    expect(appLogger.info).toHaveBeenCalledTimes(1);
    expect(appLogger.info).toHaveBeenCalledWith(expect.any(String));
    expect(wootilsMock.mocks.deferredResolve).toHaveBeenCalledTimes(1);
    expect(htmlGeneratorValues.getValues).toHaveBeenCalledTimes(1);
    expect(app.try).toHaveBeenCalledTimes(1);
    expect(app.try).toHaveBeenCalledWith('htmlGeneratorValues');
  });

  it('should register the generator with the values service disabled', async () => {
    // Given
    const appConfiguration = {
      get: jest.fn(() => {}),
    };
    const appLogger = {
      success: jest.fn(),
      info: jest.fn(),
    };
    const frontendFs = {
      read: jest.fn(() => Promise.resolve('')),
      write: jest.fn(() => Promise.resolve()),
      delete: jest.fn(() => Promise.resolve()),
    };
    const events = {
      once: jest.fn(),
    };
    let sut = null;
    const name = 'myHTMLGenerator';
    const services = {
      appConfiguration,
      appLogger,
      frontendFs,
      events,
      [name]: 'just-for-the-expect',
    };
    const app = {
      set: jest.fn(),
      get: jest.fn((service) => (service === name ? sut : services[service])),
      try: jest.fn(),
    };
    let serviceName = null;
    let serviceFn = null;
    let eventName = null;
    let eventFn = null;
    const expectedGets = Object.keys(services);
    const expectedEventName = 'after-start';
    // When
    htmlGenerator({
      serviceName: name,
      valuesService: null,
    }).register(app);
    [[serviceName, serviceFn]] = app.set.mock.calls;
    [[eventName, eventFn]] = events.once.mock.calls;
    sut = serviceFn();
    await eventFn();
    // Then
    expect(serviceName).toBe(name);
    expect(eventName).toBe(expectedEventName);
    expect(app.get).toHaveBeenCalledTimes(expectedGets.length);
    expectedGets.forEach((service) => {
      expect(app.get).toHaveBeenCalledWith(service);
    });
    expect(app.set).toHaveBeenCalledTimes(1);
    expect(app.set).toHaveBeenCalledWith(name, expect.any(Function));
    expect(events.once).toHaveBeenCalledTimes(1);
    expect(events.once).toHaveBeenCalledWith(expectedEventName, expect.any(Function));
    expect(frontendFs.read).toHaveBeenCalledTimes(1);
    expect(frontendFs.read).toHaveBeenCalledWith(`./${sut.options.template}`);
    expect(frontendFs.write).toHaveBeenCalledTimes(1);
    expect(frontendFs.write).toHaveBeenCalledWith(sut.options.file, expect.any(String));
    expect(frontendFs.delete).toHaveBeenCalledTimes(1);
    expect(frontendFs.delete).toHaveBeenCalledWith(`./${sut.options.template}`);
    expect(appLogger.success).toHaveBeenCalledTimes(1);
    expect(appLogger.success).toHaveBeenCalledWith(expect.any(String));
    expect(appLogger.info).toHaveBeenCalledTimes(1);
    expect(appLogger.info).toHaveBeenCalledWith(expect.any(String));
    expect(wootilsMock.mocks.deferredResolve).toHaveBeenCalledTimes(1);
    expect(app.try).toHaveBeenCalledTimes(0);
  });
});
