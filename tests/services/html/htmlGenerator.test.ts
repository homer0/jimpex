import {
  HTMLGenerator,
  HTMLGeneratorConstructorOptions,
  htmlGeneratorProvider,
  type HTMLGeneratorValuesService,
} from '@src/services/html/htmlGenerator';
import {
  getJimpexMock,
  getLoggerMock,
  getConfigMock,
  getFrontendFsMock,
} from '@tests/mocks';

describe('services/html:htmlGenerator', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const { logger } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs } = getFrontendFsMock();
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
        },
      };
      // When
      const sut = new HTMLGenerator(options);
      // Then
      expect(sut).toBeInstanceOf(HTMLGenerator);
      expect(sut.getOptions()).toEqual({
        template: 'index.tpl.html',
        file: 'index.html',
        silent: false,
        deleteTemplateAfter: true,
        replacePlaceholder: '{{appConfiguration}}',
        placeholderExpression: expect.any(RegExp),
        variableName: 'appConfiguration',
        configurationKeys: expect.arrayContaining([
          'features',
          'version',
          'postMessagesPrefix',
        ]),
      });
    });

    it("should throw an error if a values service doesn't have a `getValues` method", () => {
      // Given
      const { logger } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs } = getFrontendFsMock();
      const valuesService = {} as unknown as HTMLGeneratorValuesService;
      // When/Then
      expect(
        () =>
          new HTMLGenerator({
            inject: {
              logger,
              config,
              frontendFs,
              valuesService,
            },
          }),
      ).toThrowError('The HTMLGenerator values service must have a `getValues` method');
    });

    it('should generate the HTML', async () => {
      // Given
      const template = '<html>some template</html>';
      const templateFile = 'index.tpl.html';
      const resultFile = 'index.html';
      const { logger, loggerMocks } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs, frontendFsMocks } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
        },
        template: templateFile,
        file: resultFile,
      };
      // When
      const sut = new HTMLGenerator(options);
      await sut.generateHTML();
      // Then
      expect(frontendFsMocks.read).toHaveBeenCalledTimes(1);
      expect(frontendFsMocks.read).toHaveBeenCalledWith(templateFile);
      expect(frontendFsMocks.write).toHaveBeenCalledTimes(1);
      expect(frontendFsMocks.write).toHaveBeenCalledWith(resultFile, template);
      expect(frontendFsMocks.delete).toHaveBeenCalledTimes(1);
      expect(frontendFsMocks.delete).toHaveBeenCalledWith(templateFile);
      expect(loggerMocks.success).toHaveBeenCalledTimes(1);
      expect(loggerMocks.success).toHaveBeenCalledWith(
        expect.stringMatching(/The HTML file was successfully generated/i),
      );
      expect(loggerMocks.info).toHaveBeenCalledTimes(1);
      expect(loggerMocks.info).toHaveBeenCalledWith(
        expect.stringMatching(/The HTML template was successfully removed/i),
      );
    });

    it('should generate the HTML without logging messages', async () => {
      // Given
      const template = '<html>some template</html>';
      const templateFile = 'index.tpl.html';
      const { logger, loggerMocks } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
        },
        silent: true,
      };
      // When
      const sut = new HTMLGenerator(options);
      await sut.generateHTML();
      // Then
      expect(loggerMocks.success).toHaveBeenCalledTimes(0);
      expect(loggerMocks.info).toHaveBeenCalledTimes(0);
    });

    it("should throw an error if there's a problem generating the file", async () => {
      // Given
      const template = '<html>some template</html>';
      const templateFile = 'index.tpl.html';
      const { logger, loggerMocks } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const errorMessage = 'Wooo!';
      const valuesService = {
        getValues: jest.fn(() => {
          throw new Error(errorMessage);
        }),
      };
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
          valuesService,
        },
      };
      // When/Then
      const sut = new HTMLGenerator(options);
      await Promise.all([
        expect(sut.generateHTML()).rejects.toThrowError(errorMessage),
        expect(sut.whenReady()).rejects.toThrowError(errorMessage),
      ]);
      expect(loggerMocks.error).toHaveBeenCalledTimes(1);
      expect(loggerMocks.error).toHaveBeenCalledWith(
        expect.stringMatching(/There was an error while generating the HTML/i),
      );
    });

    it('should throw an error when generating the file without logging it', async () => {
      // Given
      const template = '<html>some template</html>';
      const templateFile = 'index.tpl.html';
      const { logger, loggerMocks } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const errorMessage = 'Wooo!';
      const valuesService = {
        getValues: jest.fn(() => {
          throw new Error(errorMessage);
        }),
      };
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
          valuesService,
        },
        silent: true,
      };
      // When/Then
      const sut = new HTMLGenerator(options);
      await Promise.all([
        expect(sut.generateHTML()).rejects.toThrowError(errorMessage),
        expect(sut.whenReady()).rejects.toThrowError(errorMessage),
      ]);
      expect(loggerMocks.error).toHaveBeenCalledTimes(0);
    });

    it('should generate the HTML without deleting the template', async () => {
      // Given
      const template = '<html>some template</html>';
      const templateFile = 'index.tpl.html';
      const { logger } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs, frontendFsMocks } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
        },
        silent: true,
        deleteTemplateAfter: false,
      };
      // When
      const sut = new HTMLGenerator(options);
      await sut.generateHTML();
      // Then
      expect(frontendFsMocks.delete).toHaveBeenCalledTimes(0);
    });

    it('should expose a single promise while the HTML is not generated', async () => {
      // Given
      const template = '<html>some template</html>';
      const templateFile = 'index.tpl.html';
      const { logger } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs, frontendFsMocks } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
        },
        silent: true,
        deleteTemplateAfter: false,
      };
      // When
      const sut = new HTMLGenerator(options);
      const whenReady = sut.whenReady();
      sut.generateHTML();
      await whenReady;
      await sut.whenReady();
      // Then
      expect(frontendFsMocks.write).toHaveBeenCalledTimes(1);
    });

    it("shouldn't generate it more than once", async () => {
      // Given
      const template = '<html>some template</html>';
      const templateFile = 'index.tpl.html';
      const { logger } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs, frontendFsMocks } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
        },
        silent: true,
        deleteTemplateAfter: false,
      };
      // When
      const sut = new HTMLGenerator(options);
      await sut.generateHTML();
      await sut.generateHTML();
      await sut.generateHTML();
      // Then
      expect(frontendFsMocks.write).toHaveBeenCalledTimes(1);
    });

    it("shouldn't generate it more than once (parallel)", async () => {
      // Given
      const template = '<html>some template</html>';
      const templateFile = 'index.tpl.html';
      const { logger } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs, frontendFsMocks } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
        },
        silent: true,
        deleteTemplateAfter: false,
      };
      // When
      const sut = new HTMLGenerator(options);
      await Promise.all([sut.generateHTML(), sut.generateHTML(), sut.generateHTML()]);
      // Then
      expect(frontendFsMocks.write).toHaveBeenCalledTimes(1);
    });

    it('should generate the HTML and replace placeholders', async () => {
      // Given
      const placeholder = '{{placeholder}}';
      const variableName = 'config';
      const template = [
        '<html>',
        '<script>',
        placeholder,
        '</script>',
        '<ul>',
        '  <li>enabled: {{featureName.enabled}}',
        '  <li>unknown: {{unknownFeature}}',
        '  <li>id: {{featureName.account.id}}',
        '  <li>name: {{featureName.account.name}}',
        '  <li>something: {{something}}',
        '</ul>',
        '</html>',
      ].join('\n');
      const configValues = {
        featureName: {
          enabled: true,
          account: {
            id: 'XYZ',
          },
        },
        something: 'else',
      };
      const templateFile = 'index.tpl.html';
      const resultFile = 'index.html';
      const { logger } = getLoggerMock();
      const { config, configMocks } = getConfigMock();
      configMocks.get.mockReturnValueOnce(configValues);
      const { frontendFs, frontendFsMocks } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
        },
        template: templateFile,
        file: resultFile,
        variableName,
        replacePlaceholder: placeholder,
        silent: true,
      };
      const expectedResult = [
        '<html>',
        '<script>',
        `window.${variableName} = ${JSON.stringify(configValues)}`,
        '</script>',
        '<ul>',
        `  <li>enabled: ${configValues.featureName.enabled}`,
        '  <li>unknown: undefined',
        `  <li>id: ${configValues.featureName.account.id}`,
        '  <li>name: undefined',
        `  <li>something: ${configValues.something}`,
        '</ul>',
        '</html>',
      ].join('\n');
      // When
      const sut = new HTMLGenerator(options);
      await sut.generateHTML();
      // Then
      expect(frontendFsMocks.write).toHaveBeenCalledWith(resultFile, expectedResult);
    });

    it('should generate the HTML and get the values from a service', async () => {
      // Given
      const placeholder = '{{placeholder}}';
      const variableName = 'config';
      const template = [
        '<html>',
        '<script>',
        placeholder,
        '</script>',
        '<ul>',
        '  <li>enabled: {{featureName.enabled}}',
        '  <li>unknown: {{unknownFeature}}',
        '  <li>id: {{featureName.account.id}}',
        '  <li>name: {{featureName.account.name}}',
        '  <li>something: {{something}}',
        '</ul>',
        '</html>',
      ].join('\n');
      const configValues = {
        featureName: {
          enabled: true,
          account: {
            id: 'XYZ',
          },
        },
        something: 'else',
      };
      const templateFile = 'index.tpl.html';
      const resultFile = 'index.html';
      const { logger } = getLoggerMock();
      const { config } = getConfigMock();
      const valuesService = {
        getValues: jest.fn(() => Promise.resolve(configValues)),
      };
      const { frontendFs, frontendFsMocks } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
          valuesService,
        },
        template: templateFile,
        file: resultFile,
        variableName,
        replacePlaceholder: placeholder,
        silent: true,
      };
      const expectedResult = [
        '<html>',
        '<script>',
        `window.${variableName} = ${JSON.stringify(configValues)}`,
        '</script>',
        '<ul>',
        `  <li>enabled: ${configValues.featureName.enabled}`,
        '  <li>unknown: undefined',
        `  <li>id: ${configValues.featureName.account.id}`,
        '  <li>name: undefined',
        `  <li>something: ${configValues.something}`,
        '</ul>',
        '</html>',
      ].join('\n');
      // When
      const sut = new HTMLGenerator(options);
      await sut.generateHTML();
      // Then
      expect(frontendFsMocks.write).toHaveBeenCalledWith(resultFile, expectedResult);
    });

    it('should generate the HTML and set an empty object in the placeholder', async () => {
      // Given
      const placeholder = '{{placeholder}}';
      const variableName = 'config';
      const template = ['<html>', '<script>', placeholder, '</script>', '</html>'].join(
        '\n',
      );
      const templateFile = 'index.tpl.html';
      const resultFile = 'index.html';
      const { logger } = getLoggerMock();
      const { config } = getConfigMock();
      const { frontendFs, frontendFsMocks } = getFrontendFsMock({
        values: {
          [templateFile]: template,
        },
      });
      const options: HTMLGeneratorConstructorOptions = {
        inject: {
          logger,
          config,
          frontendFs,
        },
        template: templateFile,
        file: resultFile,
        variableName,
        replacePlaceholder: placeholder,
        silent: true,
        configurationKeys: [],
      };
      const expectedResult = [
        '<html>',
        '<script>',
        `window.${variableName} = {}`,
        '</script>',
        '</html>',
      ].join('\n');
      // When
      const sut = new HTMLGenerator(options);
      await sut.generateHTML();
      // Then
      expect(frontendFsMocks.write).toHaveBeenCalledWith(resultFile, expectedResult);
    });
  });

  describe('provider', () => {
    it('should register the service', () => {
      // Given
      const { container, containerMocks: mocks } = getJimpexMock();
      // When
      htmlGeneratorProvider.register(container);
      const [[, lazy]] = mocks.set.mock.calls as [[string, () => HTMLGenerator]];
      const result = lazy();
      // Then
      expect(result).toBeInstanceOf(HTMLGenerator);
      expect(mocks.set).toHaveBeenCalledTimes(1);
      expect(mocks.set).toHaveBeenCalledWith('htmlGenerator', expect.any(Function));
      expect(mocks.get).toHaveBeenCalledTimes(3);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'logger');
      expect(mocks.get).toHaveBeenNthCalledWith(3, 'frontendFs');
      expect(mocks.try).toHaveBeenCalledTimes(1);
      expect(mocks.try).toHaveBeenCalledWith('htmlGeneratorValues');
      expect(mocks.once).toHaveBeenCalledTimes(1);
      expect(mocks.once).toHaveBeenCalledWith('afterStart', expect.any(Function));
    });

    it('should generate the HTML when the app starts', () => {
      // Given
      const fakeHTMLGenerator = {
        generateHTML: jest.fn(),
      };
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          htmlGenerator: fakeHTMLGenerator,
        },
      });
      // When
      htmlGeneratorProvider.register(container);
      const [[, listener]] = mocks.once.mock.calls as [[string, () => HTMLGenerator]];
      listener();
      // Then
      expect(fakeHTMLGenerator.generateHTML).toHaveBeenCalledTimes(1);
    });
  });
});
