/* eslint-disable no-process-env, dot-notation */
import fs from 'fs/promises';
import * as path from 'path';
import {
  https,
  spdy,
  express,
  resetDependencies,
  setupCase,
  appLoggerProvider,
  simpleConfigProvider,
  envUtilsProvider,
  packageInfoProvider,
  pathUtilsProvider,
  rootFileProvider,
} from '@tests/mocks/jimpexSetup';
import { statuses } from '@src/utils';
import { Jimpex, jimpex } from '@src/app/jimpex';
import { EventsHub } from '@homer0/events-hub';
import { SimpleLogger } from '@homer0/simple-logger';
import type {
  JimpexOptions,
  DeepPartial,
  HTTPSServer,
  Router,
  ExpressMiddleware,
} from '@src/types';

describe('Jimpex', () => {
  describe('class', () => {
    beforeEach(() => {
      delete process.env['NODE_TLS_REJECT_UNAUTHORIZED'];
      resetDependencies();
    });

    it('should be instantiated', () => {
      // Given
      const {
        express: { expressMocks },
        wootils: { pathUtilsMocks },
        services: { commonServices, httpServices, utilsServices },
      } = setupCase();
      // When
      const sut = new Jimpex();
      // Then
      expect(sut).toBeInstanceOf(Jimpex);
      expect(express).toHaveBeenCalledTimes(1);
      expect(appLoggerProvider).toHaveBeenCalledTimes(1);
      expect(appLoggerProvider).toHaveBeenCalledWith({
        serviceName: 'logger',
      });
      expect(envUtilsProvider.register).toHaveBeenCalledTimes(1);
      expect(envUtilsProvider.register).toHaveBeenCalledWith(sut);
      expect(packageInfoProvider.register).toHaveBeenCalledTimes(1);
      expect(packageInfoProvider.register).toHaveBeenCalledWith(sut);
      expect(pathUtilsProvider.register).toHaveBeenCalledTimes(1);
      expect(pathUtilsProvider.register).toHaveBeenCalledWith(sut);
      expect(rootFileProvider.register).toHaveBeenCalledTimes(1);
      expect(rootFileProvider.register).toHaveBeenCalledWith(sut);
      expect(commonServices).toHaveBeenCalledTimes(1);
      expect(commonServices).toHaveBeenCalledWith(sut);
      expect(httpServices).toHaveBeenCalledTimes(1);
      expect(httpServices).toHaveBeenCalledWith(sut);
      expect(utilsServices).toHaveBeenCalledTimes(1);
      expect(utilsServices).toHaveBeenCalledWith(sut);
      expect(expressMocks.enable).toHaveBeenCalledTimes(1);
      expect(expressMocks.enable).toHaveBeenCalledWith('trust proxy');
      expect(expressMocks.disable).toHaveBeenCalledTimes(1);
      expect(expressMocks.disable).toHaveBeenCalledWith('x-powered-by');
      expect(expressMocks.use).toHaveBeenCalledTimes(4);
      expect(expressMocks.use).toHaveBeenNthCalledWith(1, {
        compression: true,
      });
      expect(expressMocks.use).toHaveBeenNthCalledWith(2, {
        json: true,
      });
      expect(expressMocks.use).toHaveBeenNthCalledWith(3, {
        urlencoded: true,
      });
      expect(expressMocks.use).toHaveBeenNthCalledWith(4, {
        multerAny: true,
      });
      expect(pathUtilsMocks.addLocation).toHaveBeenCalledTimes(1);
      expect(pathUtilsMocks.addLocation).toHaveBeenCalledWith('app', __dirname);
      expect(sut.get('router')).toEqual({
        router: true,
      });
      expect(sut.getRouter()).toEqual({
        router: true,
      });
      expect(sut.get('statuses')).toBe(statuses);
      expect(sut.eventsHub).toBeInstanceOf(EventsHub);
      expect(sut.logger).toBeInstanceOf(SimpleLogger);
      expect(sut.express).toBe(expressMocks);
      expect(sut.instance).toBeUndefined();
      expect(sut.routes).toEqual([]);
      expect(sut.options).toEqual({
        filesizeLimit: '15MB',
        boot: true,
        path: {
          appPath: '',
          useParentPath: true,
        },
        config: {
          default: {},
          name: 'app',
          path: 'config/',
          hasFolder: false,
          environmentVariable: 'CONFIG',
          loadFromEnvironment: true,
          defaultConfigFilename: '[app-name].config.js',
          filenameFormat: '[app-name].[config-name].config.js',
        },
        statics: {
          enabled: true,
          onHome: false,
          route: 'statics',
        },
        express: {
          trustProxy: true,
          disableXPoweredBy: true,
          compression: true,
          bodyParser: true,
          multer: true,
        },
        services: {
          common: true,
          http: true,
          utils: true,
        },
        healthCheck: expect.any(Function),
      });
    });

    it('should call the basic lifecycle methods', () => {
      // Given
      const initFn = jest.fn();
      const initOptionsFn = jest.fn();
      const bootFn = jest.fn();
      class Sut extends Jimpex {
        override boot(): void {
          bootFn();
        }
        protected override _init(): void {
          initFn();
        }
        protected override _initOptions(): DeepPartial<JimpexOptions> {
          initOptionsFn();
          return {};
        }
      }
      setupCase();
      // When
      const sut = new Sut();
      // Then
      expect(sut).toBeInstanceOf(Jimpex);
      expect(initFn).toHaveBeenCalledTimes(1);
      expect(initOptionsFn).toHaveBeenCalledTimes(1);
      expect(bootFn).toHaveBeenCalledTimes(1);
    });

    it('should be instantiated with custom options', () => {
      // Given
      const bootFn = jest.fn();
      class Sut extends Jimpex {
        override boot(): void {
          bootFn();
        }
      }
      const {
        express: { expressMocks },
        wootils: { pathUtilsMocks },
        services: { commonServices, httpServices, utilsServices },
      } = setupCase();
      const options: DeepPartial<JimpexOptions> = {
        filesizeLimit: '10MB',
        boot: false,
        path: {
          appPath: 'app',
          useParentPath: false,
        },
        config: {
          default: {
            x: 'y',
          },
          name: 'config',
          path: 'configs/',
          hasFolder: false,
          environmentVariable: 'CONFIGS',
          loadFromEnvironment: false,
          defaultConfigFilename: '[app-name].xconfig.js',
          filenameFormat: '[app-name].[config-name].xconfig.js',
        },
        statics: {
          enabled: false,
          onHome: true,
          route: 'statics',
          folder: 'statics',
        },
        express: {
          trustProxy: false,
          disableXPoweredBy: false,
          compression: false,
          bodyParser: false,
          multer: false,
        },
        services: {
          common: false,
          http: false,
          utils: false,
        },
        healthCheck: () => {},
      };
      // When
      const sut = new Sut(options);
      // Then
      expect(bootFn).toHaveBeenCalledTimes(0);
      expect(commonServices).toHaveBeenCalledTimes(0);
      expect(httpServices).toHaveBeenCalledTimes(0);
      expect(utilsServices).toHaveBeenCalledTimes(0);
      expect(expressMocks.enable).toHaveBeenCalledTimes(0);
      expect(expressMocks.disable).toHaveBeenCalledTimes(0);
      expect(expressMocks.use).toHaveBeenCalledTimes(0);
      expect(pathUtilsMocks.addLocation).toHaveBeenCalledTimes(1);
      expect(pathUtilsMocks.addLocation).toHaveBeenCalledWith(
        'app',
        options.path!.appPath,
      );
      expect(sut.options).toEqual(options);
    });

    it('should overwrite the options with the protected method', () => {
      // Given
      const customOptions = {
        version: '1.0.0',
        filesizeLimit: '10MB',
        config: {
          default: {
            x: 'y',
          },
          name: 'config',
          path: 'configs/',
          hasFolder: false,
          environmentVariable: 'CONFIGS',
          loadFromEnvironment: false,
          defaultConfigFilename: '[app-name].xconfig.js',
          filenameFormat: '[app-name].[config-name].xconfig.js',
        },
      };
      class Sut extends Jimpex {
        protected override _initOptions(): DeepPartial<JimpexOptions> {
          return customOptions;
        }
      }
      setupCase();
      // When
      const sut = new Sut();
      // Then
      expect(sut.options).toEqual(expect.objectContaining(customOptions));
    });

    it('should disable the TLS validation (for dev)', () => {
      // Given
      const {
        wootils: { loggerMocks },
      } = setupCase();
      // When
      const prevStatus = process.env['NODE_TLS_REJECT_UNAUTHORIZED'];
      const sut = new Jimpex();
      sut.disableTLSValidation();
      // Then
      expect(prevStatus).toBeUndefined();
      expect(process.env['NODE_TLS_REJECT_UNAUTHORIZED']).toBe('0');
      expect(loggerMocks.warn).toHaveBeenCalledTimes(1);
      expect(loggerMocks.warn).toHaveBeenCalledWith('TLS validation has been disabled');
    });

    it("should throw an error if the app path can't be determined", () => {
      // Given
      setupCase();
      // When/Then
      expect(
        () =>
          new Jimpex({
            path: {
              appPath: '',
              useParentPath: false,
            },
          }),
      ).toThrow(/The app location cannot be determined/i);
    });

    describe('health check', () => {
      beforeEach(resetDependencies);

      it('should return `true` as default', async () => {
        // Given
        setupCase();
        // When
        const sut = new Jimpex();
        const result = await sut.isHealthy();
        // Then
        expect(result).toBe(true);
      });

      it('should be overwriten by the options', async () => {
        // Given
        setupCase();
        const healthStatus = false;
        const healthCheck = jest.fn().mockResolvedValueOnce(healthStatus);
        const options: DeepPartial<JimpexOptions> = {
          healthCheck,
        };
        // When
        const sut = new Jimpex(options);
        const result = await sut.isHealthy();
        // Then
        expect(result).toBe(healthStatus);
        expect(healthCheck).toHaveBeenCalledWith(sut);
      });
    });

    describe('events', () => {
      beforeEach(resetDependencies);

      it('should proxy `on` and `once`', () => {
        // Given
        setupCase();
        const events = {
          on: jest.fn(),
          once: jest.fn(),
        };
        const onListener = () => {};
        const onceListener = () => {};
        // When
        const sut = new Jimpex();
        sut.set('events', () => events);
        sut.on('afterStart', onListener);
        sut.once('afterStart', onceListener);
        // Then
        expect(events.on).toHaveBeenCalledTimes(1);
        expect(events.on).toHaveBeenCalledWith('afterStart', onListener);
        expect(events.once).toHaveBeenCalledTimes(1);
        expect(events.once).toHaveBeenCalledWith('afterStart', onceListener);
      });
    });

    describe('server', () => {
      describe('basic', () => {
        beforeEach(resetDependencies);

        it('should start and stop the server', async () => {
          // Given
          const onBeforeStart = jest.fn();
          const onStart = jest.fn();
          const onAfterStart = jest.fn();
          const onBeforeStop = jest.fn();
          const onAfterStop = jest.fn();
          const {
            wootils: { configMocks, loggerMocks },
            express: { expressMocks, instanceMock },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          // When
          const sut = new Jimpex();
          const events = sut.eventsHub;
          events.on('beforeStart', onBeforeStart);
          events.on('start', onStart);
          events.on('afterStart', onAfterStart);
          events.on('beforeStop', onBeforeStop);
          events.on('afterStop', onAfterStop);
          const instanceBeforeStart = sut.instance;
          await sut.start();
          const instanceAfterStart = sut.instance;
          sut.stop();
          // Then
          expect(instanceBeforeStart).toBeUndefined();
          expect(instanceAfterStart).toBe(instanceMock);
          expect(expressMocks.listen).toHaveBeenCalledTimes(1);
          expect(expressMocks.listen).toHaveBeenCalledWith(port, expect.any(Function));
          expect(instanceMock.close).toHaveBeenCalledTimes(1);
          expect(onBeforeStart).toHaveBeenCalledTimes(1);
          expect(onBeforeStart).toHaveBeenCalledWith({ app: sut });
          expect(onStart).toHaveBeenCalledTimes(1);
          expect(onStart).toHaveBeenCalledWith({ app: sut });
          expect(onAfterStart).toHaveBeenCalledTimes(1);
          expect(onAfterStart).toHaveBeenCalledWith({ app: sut });
          expect(onBeforeStop).toHaveBeenCalledTimes(1);
          expect(onBeforeStop).toHaveBeenCalledWith({ app: sut });
          expect(onAfterStop).toHaveBeenCalledTimes(1);
          expect(onAfterStop).toHaveBeenCalledWith({ app: sut });
          expect(loggerMocks.success).toHaveBeenCalledTimes(1);
          expect(loggerMocks.success).toHaveBeenCalledWith(`Starting on port ${port}`);
          expect(configMocks.loadFromFile).toHaveBeenCalledTimes(1);
          expect(configMocks.loadFromFile).toHaveBeenCalledWith('', true, false);
          expect(configMocks.loadFromEnv).toHaveBeenCalledTimes(1);
          expect(simpleConfigProvider).toHaveBeenCalledTimes(1);
          expect(simpleConfigProvider).toHaveBeenCalledWith({
            name: 'app',
            defaultConfig: {},
            defaultConfigFilename: 'app.config.js',
            envVarName: 'CONFIG',
            path: `config`,
            filenameFormat: 'app.[name].config.js',
          });
        });

        it('should throw error if theres no port configured', async () => {
          // Given
          setupCase();
          // When/Then
          const sut = new Jimpex();
          await expect(() => sut.start()).rejects.toThrow(/No port configured/i);
        });

        it('should load the config from a folder', async () => {
          // Given
          const {
            wootils: { configMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onStart = jest.fn();
          // When
          const sut = new Jimpex({
            config: {
              hasFolder: true,
            },
          });
          await sut.start(onStart);
          // Then
          expect(simpleConfigProvider).toHaveBeenCalledWith(
            expect.objectContaining({
              path: `config${path.sep}app${path.sep}`,
            }),
          );
        });

        it('should invoke a callback when starting', async () => {
          // Given
          const {
            wootils: { configMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onStart = jest.fn();
          // When
          const sut = new Jimpex();
          await sut.start(onStart);
          // Then
          expect(onStart).toHaveBeenCalledTimes(1);
          expect(onStart).toHaveBeenCalledWith(sut.getConfig());
        });

        it("shouldn't do anything if `stop` is called before `start`", async () => {
          // Given
          const onBeforeStop = jest.fn();
          setupCase();
          // When
          const sut = new Jimpex();
          const events = sut.eventsHub;
          events.on('beforeStop', onBeforeStop);
          sut.stop();
          // Then
          expect(onBeforeStop).toHaveBeenCalledTimes(0);
        });
      });

      describe('statics', () => {
        beforeEach(resetDependencies);

        it('should mount the statics middleware/controller', async () => {
          // Given
          const {
            express: { staticMock, expressMocks },
            wootils: { configMocks, pathUtilsMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onControllerWillBeMounted = jest.fn(<T>(target: T): T => target);
          // When
          const sut = new Jimpex();
          sut.on('controllerWillBeMounted', onControllerWillBeMounted);
          await sut.start();
          // Then
          expect(staticMock).toHaveBeenCalledTimes(1);
          expect(staticMock).toHaveBeenCalledWith('statics');
          expect(pathUtilsMocks.joinFrom).toHaveBeenCalledTimes(1);
          expect(pathUtilsMocks.joinFrom).toHaveBeenCalledWith('app', 'statics');
          expect(expressMocks.use).toHaveBeenCalledTimes(5);
          expect(expressMocks.use).toHaveBeenNthCalledWith(1, {
            compression: true,
          });
          expect(expressMocks.use).toHaveBeenNthCalledWith(2, {
            json: true,
          });
          expect(expressMocks.use).toHaveBeenNthCalledWith(3, {
            urlencoded: true,
          });
          expect(expressMocks.use).toHaveBeenNthCalledWith(4, {
            multerAny: true,
          });
          expect(expressMocks.use).toHaveBeenNthCalledWith(5, '/statics', {
            static: true,
          });
          expect(onControllerWillBeMounted).toHaveBeenCalledTimes(1);
          expect(onControllerWillBeMounted).toHaveBeenCalledWith(
            {
              static: true,
            },
            {
              route: '/statics',
              controller: expect.objectContaining({
                connect: expect.any(Function),
                controller: true,
              }),
              app: sut,
            },
          );
        });

        it('should mount the statics middleware/controller on the home path', async () => {
          // Given
          const {
            express: { staticMock, expressMocks },
            wootils: { configMocks, pathUtilsMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          // When
          const sut = new Jimpex({
            statics: {
              onHome: true,
            },
          });
          await sut.start();
          // Then
          expect(staticMock).toHaveBeenCalledTimes(1);
          expect(staticMock).toHaveBeenCalledWith('statics');
          expect(pathUtilsMocks.joinFrom).toHaveBeenCalledTimes(1);
          expect(pathUtilsMocks.joinFrom).toHaveBeenCalledWith('home', 'statics');
          expect(expressMocks.use).toHaveBeenCalledTimes(5);
          expect(expressMocks.use).toHaveBeenNthCalledWith(5, '/statics', {
            static: true,
          });
        });

        it('should allow to add multiple static middlewares/controllers when subclassed', async () => {
          // Given
          const sameRoute = 'same-route-statics';
          const differentRoute = 'different-route-statics';
          const differentPath = 'different-path-statics';
          class Sut extends Jimpex {
            override boot(): void {
              this._addStaticsFolder(sameRoute);
              this._addStaticsFolder(differentRoute, differentPath);
            }
          }
          const {
            express: { staticMock, expressMocks },
            wootils: { configMocks, pathUtilsMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          // When
          const sut = new Sut();
          await sut.start();
          // Then
          expect(staticMock).toHaveBeenCalledTimes(3);
          expect(staticMock).toHaveBeenNthCalledWith(2, sameRoute);
          expect(staticMock).toHaveBeenNthCalledWith(3, differentPath);
          expect(pathUtilsMocks.joinFrom).toHaveBeenCalledTimes(3);
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(2, 'app', sameRoute);
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(
            3,
            'app',
            differentPath,
          );
          expect(expressMocks.use).toHaveBeenCalledTimes(7);
          expect(expressMocks.use).toHaveBeenNthCalledWith(6, `/${sameRoute}`, {
            static: true,
          });
          expect(expressMocks.use).toHaveBeenNthCalledWith(7, `/${differentRoute}`, {
            static: true,
          });
        });
      });

      describe('listen', () => {
        beforeEach(resetDependencies);

        it('should start the server', async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { instanceMock },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          // When
          const sut = new Jimpex();
          await sut.listen();
          // Then
          expect(sut.instance).toBe(instanceMock);
        });

        it('should overwrite the port on the config', async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { instanceMock },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          // When
          const sut = new Jimpex();
          await sut.listen(port);
          // Then
          expect(sut.instance).toBe(instanceMock);
          expect(configMocks.set).toHaveBeenCalledTimes(1);
          expect(configMocks.set).toHaveBeenCalledWith('port', port);
        });

        it('should invoke a callback when starting', async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { instanceMock },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onStart = jest.fn();
          // When
          const sut = new Jimpex();
          await sut.listen(undefined, onStart);
          // Then
          expect(sut.instance).toBe(instanceMock);
          expect(onStart).toHaveBeenCalledTimes(1);
          expect(onStart).toHaveBeenCalledWith(sut.getConfig());
        });
      });

      describe('config', () => {
        beforeEach(resetDependencies);

        it('should throw an error if trying to access it before starting the server', () => {
          // Given
          setupCase();
          // When/Then
          const sut = new Jimpex();
          expect(() => sut.getConfig()).toThrow(
            /The config service is not available until the app starts/i,
          );
        });

        it('should return the config service', async () => {
          // Given
          const {
            wootils: { configMocks, config },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          // When
          const sut = new Jimpex();
          await sut.listen();
          const result = sut.getConfig();
          // Then
          expect(result).toBe(config);
        });
      });

      describe('https', () => {
        beforeEach(() => {
          resetDependencies();
          jest.spyOn(fs, 'readFile').mockReset();
        });

        it('should start a secure server', async () => {
          // Given
          const {
            wootils: { configMocks, pathUtilsMocks },
            express: { expressMocks, instanceMock },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          const caPath = 'ca';
          const certPath = 'cert';
          const httpsConfig = {
            enabled: true,
            credentials: {
              onHome: true,
              ca: caPath,
              cert: certPath,
            },
          };
          configMocks.get.mockImplementationOnce(() => [undefined, httpsConfig]);
          const caFile = 'ca-file';
          const certFile = 'cert-file';
          jest
            .spyOn(fs, 'readFile')
            .mockResolvedValueOnce(caFile)
            .mockResolvedValueOnce(certFile);
          https.createServer.mockReturnValueOnce(expressMocks as unknown as HTTPSServer);
          // When
          const sut = new Jimpex();
          await sut.start();
          // Then
          expect(sut.instance).toBe(instanceMock);
          expect(fs.readFile).toHaveBeenCalledTimes(2);
          expect(fs.readFile).toHaveBeenNthCalledWith(1, caPath, 'utf8');
          expect(fs.readFile).toHaveBeenNthCalledWith(2, certPath, 'utf8');
          expect(pathUtilsMocks.joinFrom).toHaveBeenCalledTimes(3);
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(1, 'app', 'statics');
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(2, 'home', caPath);
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(3, 'home', certPath);
          expect(https.createServer).toHaveBeenCalledTimes(1);
          expect(https.createServer).toHaveBeenCalledWith(
            {
              ca: caFile,
              cert: certFile,
            },
            expressMocks,
          );
        });

        it('should load the credentials from the `app` location', async () => {
          // Given
          const {
            wootils: { configMocks, pathUtilsMocks },
            express: { expressMocks, instanceMock },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          const caPath = 'ca';
          const certPath = 'cert';
          const httpsConfig = {
            enabled: true,
            credentials: {
              onHome: false,
              ca: caPath,
              cert: certPath,
            },
          };
          configMocks.get.mockImplementationOnce(() => [undefined, httpsConfig]);
          const caFile = 'ca-file';
          const certFile = 'cert-file';
          jest
            .spyOn(fs, 'readFile')
            .mockResolvedValueOnce(caFile)
            .mockResolvedValueOnce(certFile);
          https.createServer.mockReturnValueOnce(expressMocks as unknown as HTTPSServer);
          // When
          const sut = new Jimpex();
          await sut.start();
          // Then
          expect(sut.instance).toBe(instanceMock);
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(1, 'app', 'statics');
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(2, 'app', caPath);
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(3, 'app', certPath);
          expect(https.createServer).toHaveBeenCalledTimes(1);
        });

        it('should throw an error if no credentials object is provided', async () => {
          // Given
          const {
            wootils: { configMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          const httpsConfig = {
            enabled: true,
          };
          configMocks.get.mockImplementationOnce(() => [undefined, httpsConfig]);
          // When/Then
          const sut = new Jimpex();
          await expect(() => sut.start()).rejects.toThrow(
            /The `credentials` object on the HTTPS settings is missing/i,
          );
        });

        it("should throw an error if no credentials' files are provided", async () => {
          // Given
          const {
            wootils: { configMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          const httpsConfig = {
            enabled: true,
            credentials: {},
          };
          configMocks.get.mockImplementationOnce(() => [undefined, httpsConfig]);
          // When/Then
          const sut = new Jimpex();
          await expect(() => sut.start()).rejects.toThrow(
            /No credentials were found for HTTPS/i,
          );
        });
      });

      describe('http2', () => {
        beforeEach(() => {
          resetDependencies();
          jest.spyOn(fs, 'readFile').mockReset();
        });

        it('should start a spdy server', async () => {
          // Given
          const {
            wootils: { configMocks, pathUtilsMocks },
            express: { expressMocks, instanceMock },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          const caPath = 'ca';
          const certPath = 'cert';
          const httpsConfig = {
            enabled: true,
            credentials: {
              onHome: true,
              ca: caPath,
              cert: certPath,
            },
          };
          const http2Config = {
            enabled: true,
            spdy: 'some-options',
          };
          configMocks.get.mockImplementationOnce(() => [http2Config, httpsConfig]);
          const caFile = 'ca-file';
          const certFile = 'cert-file';
          jest
            .spyOn(fs, 'readFile')
            .mockResolvedValueOnce(caFile)
            .mockResolvedValueOnce(certFile);
          spdy.createServer.mockReturnValueOnce(expressMocks as unknown as HTTPSServer);
          // When
          const sut = new Jimpex();
          await sut.start();
          // Then
          expect(sut.instance).toBe(instanceMock);
          expect(fs.readFile).toHaveBeenCalledTimes(2);
          expect(fs.readFile).toHaveBeenNthCalledWith(1, caPath, 'utf8');
          expect(fs.readFile).toHaveBeenNthCalledWith(2, certPath, 'utf8');
          expect(pathUtilsMocks.joinFrom).toHaveBeenCalledTimes(3);
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(1, 'app', 'statics');
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(2, 'home', caPath);
          expect(pathUtilsMocks.joinFrom).toHaveBeenNthCalledWith(3, 'home', certPath);
          expect(spdy.createServer).toHaveBeenCalledTimes(1);
          expect(spdy.createServer).toHaveBeenCalledWith(
            {
              ca: caFile,
              cert: certFile,
              spdy: 'some-options',
            },
            expressMocks,
          );
        });

        it('should throw error if HTTPS is not enabled', async () => {
          // Given
          const {
            wootils: { configMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          const httpsConfig = {};
          const http2Config = {
            enabled: true,
          };
          configMocks.get.mockImplementationOnce(() => [http2Config, httpsConfig]);
          // When/Then
          const sut = new Jimpex();
          await expect(() => sut.start()).rejects.toThrow(
            /HTTP2 requires for HTTPS to be enabled/,
          );
        });
      });

      describe('mount', () => {
        beforeEach(resetDependencies);

        it('should mount a controller', async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { expressMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onControllerWillBeMounted = jest.fn(<T>(target: T): T => target);
          const onRouteAdded = jest.fn();
          const controllerObj = {
            theControllerToMount: true,
          };
          const controller = {
            connect: jest.fn(() => controllerObj as unknown as Router),
            controller: true as const,
          };
          const route = 'my-route';
          // When
          const sut = new Jimpex();
          sut.on('controllerWillBeMounted', onControllerWillBeMounted);
          sut.on('routeAdded', onRouteAdded);
          sut.mount(route, controller);
          await sut.start();
          // Then
          expect(controller.connect).toHaveBeenCalledTimes(1);
          expect(controller.connect).toHaveBeenCalledWith(sut, route);
          expect(expressMocks.use).toHaveBeenCalledTimes(6);
          expect(expressMocks.use).toHaveBeenNthCalledWith(6, route, controllerObj);
          expect(onControllerWillBeMounted).toHaveBeenCalledTimes(2);
          expect(onControllerWillBeMounted).toHaveBeenNthCalledWith(2, controllerObj, {
            route,
            controller,
            app: sut,
          });
          expect(onRouteAdded).toHaveBeenCalledTimes(2);
          expect(onRouteAdded).toHaveBeenNthCalledWith(2, {
            route,
            app: sut,
          });
        });

        it('should mount a middleware', async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { expressMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onControllerWillBeMounted = jest.fn(<T>(target: T): T => target);
          const middlewareObj = {
            theControllerToMount: true,
          };
          const middleware = {
            connect: jest.fn(() => middlewareObj as unknown as ExpressMiddleware),
            middleware: true as const,
          };
          const route = 'my-route';
          // When
          const sut = new Jimpex();
          sut.on('controllerWillBeMounted', onControllerWillBeMounted);
          sut.mount(route, middleware);
          await sut.start();
          // Then
          expect(middleware.connect).toHaveBeenCalledTimes(1);
          expect(middleware.connect).toHaveBeenCalledWith(sut, route);
          expect(expressMocks.use).toHaveBeenCalledTimes(6);
          expect(expressMocks.use).toHaveBeenNthCalledWith(6, route, middlewareObj);
          expect(onControllerWillBeMounted).toHaveBeenCalledTimes(2);
          expect(onControllerWillBeMounted).toHaveBeenNthCalledWith(2, middlewareObj, {
            route,
            controller: middleware,
            app: sut,
          });
        });

        it("shouldn't mount a middleware that returns undefined", async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { expressMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onControllerWillBeMounted = jest.fn(<T>(target: T): T => target);
          const middleware = {
            connect: jest.fn(),
            middleware: true as const,
          };
          const route = 'my-route';
          // When
          const sut = new Jimpex();
          sut.on('controllerWillBeMounted', onControllerWillBeMounted);
          sut.mount(route, middleware);
          await sut.start();
          // Then
          expect(middleware.connect).toHaveBeenCalledTimes(1);
          expect(middleware.connect).toHaveBeenCalledWith(sut, route);
          expect(expressMocks.use).toHaveBeenCalledTimes(5);
          expect(onControllerWillBeMounted).toHaveBeenCalledTimes(1);
        });

        it('should mount a provider controller', async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { expressMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const controllerObj = {
            theControllerToMount: true,
          };
          const controller = {
            connect: jest.fn(() => controllerObj as unknown as Router),
            controller: true as const,
          };
          const provider = {
            register: jest.fn(() => controller),
            provider: true as const,
          };
          const route = 'my-route';
          // When
          const sut = new Jimpex();
          sut.mount(route, provider);
          await sut.start();
          // Then
          expect(provider.register).toHaveBeenCalledTimes(1);
          expect(provider.register).toHaveBeenCalledWith(sut, route);
          expect(controller.connect).toHaveBeenCalledTimes(1);
          expect(controller.connect).toHaveBeenCalledWith(sut, route);
          expect(expressMocks.use).toHaveBeenCalledTimes(6);
          expect(expressMocks.use).toHaveBeenNthCalledWith(6, route, controllerObj);
        });

        it('should mount an express middleware', async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { expressMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const middleware = () => {};
          const route = 'my-route';
          // When
          const sut = new Jimpex();
          sut.mount(route, middleware);
          await sut.start();
          // Then
          expect(expressMocks.use).toHaveBeenCalledTimes(6);
          expect(expressMocks.use).toHaveBeenNthCalledWith(6, route, middleware);
        });
      });

      describe('use', () => {
        beforeEach(resetDependencies);

        it('should use a middleware', async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { expressMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onMiddlewareWillBeUsed = jest.fn(<T>(target: T): T => target);
          const middlewareObj = {
            theControllerToMount: true,
          };
          const middleware = {
            connect: jest.fn(() => middlewareObj as unknown as ExpressMiddleware),
            middleware: true as const,
          };
          // When
          const sut = new Jimpex();
          sut.on('middlewareWillBeUsed', onMiddlewareWillBeUsed);
          sut.use(middleware);
          await sut.start();
          // Then
          expect(middleware.connect).toHaveBeenCalledTimes(1);
          expect(middleware.connect).toHaveBeenCalledWith(sut);
          expect(expressMocks.use).toHaveBeenCalledTimes(6);
          expect(expressMocks.use).toHaveBeenNthCalledWith(6, middlewareObj);
          expect(onMiddlewareWillBeUsed).toHaveBeenCalledTimes(1);
          expect(onMiddlewareWillBeUsed).toHaveBeenNthCalledWith(1, middlewareObj, {
            app: sut,
          });
        });

        it("shouldn't use a middleware that returns undefined", async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { expressMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onMiddlewareWillBeUsed = jest.fn(<T>(target: T): T => target);
          const middleware = {
            connect: jest.fn(),
            middleware: true as const,
          };
          // When
          const sut = new Jimpex();
          sut.on('middlewareWillBeUsed', onMiddlewareWillBeUsed);
          sut.use(middleware);
          await sut.start();
          // Then
          expect(middleware.connect).toHaveBeenCalledTimes(1);
          expect(middleware.connect).toHaveBeenCalledWith(sut);
          expect(expressMocks.use).toHaveBeenCalledTimes(5);
          expect(onMiddlewareWillBeUsed).toHaveBeenCalledTimes(0);
        });

        it('should use a middleware a provider', async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { expressMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onMiddlewareWillBeUsed = jest.fn(<T>(target: T): T => target);
          const middlewareObj = {
            theControllerToMount: true,
          };
          const middleware = {
            connect: jest.fn(() => middlewareObj as unknown as ExpressMiddleware),
            middleware: true as const,
          };
          const provider = {
            register: jest.fn(() => middleware),
            provider: true as const,
          };
          // When
          const sut = new Jimpex();
          sut.on('middlewareWillBeUsed', onMiddlewareWillBeUsed);
          sut.use(provider);
          await sut.start();
          // Then
          expect(middleware.connect).toHaveBeenCalledTimes(1);
          expect(middleware.connect).toHaveBeenCalledWith(sut);
          expect(provider.register).toHaveBeenCalledTimes(1);
          expect(provider.register).toHaveBeenCalledWith(sut);
          expect(expressMocks.use).toHaveBeenCalledTimes(6);
          expect(expressMocks.use).toHaveBeenNthCalledWith(6, middlewareObj);
          expect(onMiddlewareWillBeUsed).toHaveBeenCalledTimes(1);
          expect(onMiddlewareWillBeUsed).toHaveBeenNthCalledWith(1, middlewareObj, {
            app: sut,
          });
        });

        it('should use an express middleware', async () => {
          // Given
          const {
            wootils: { configMocks },
            express: { expressMocks },
          } = setupCase();
          const port = 2509;
          configMocks.get.mockImplementationOnce(() => port);
          configMocks.get.mockImplementationOnce(() => []);
          const onMiddlewareWillBeUsed = jest.fn(<T>(target: T): T => target);
          const middleware = () => {};
          // When
          const sut = new Jimpex();
          sut.on('middlewareWillBeUsed', onMiddlewareWillBeUsed);
          sut.use(middleware);
          await sut.start();
          // Then
          expect(expressMocks.use).toHaveBeenCalledTimes(6);
          expect(expressMocks.use).toHaveBeenNthCalledWith(6, middleware);
          expect(onMiddlewareWillBeUsed).toHaveBeenCalledTimes(1);
          expect(onMiddlewareWillBeUsed).toHaveBeenNthCalledWith(1, middleware, {
            app: sut,
          });
        });
      });
    });
  });

  describe('shorthand function', () => {
    it('should create a Jimpex instance', () => {
      // Given
      const customOptions = {
        version: '1.0.0',
        filesizeLimit: '10MB',
        config: {
          default: {
            x: 'y',
          },
          name: 'config',
          path: 'configs/',
          hasFolder: false,
          environmentVariable: 'CONFIGS',
          loadFromEnvironment: false,
          defaultConfigFilename: '[app-name].xconfig.js',
          filenameFormat: '[app-name].[config-name].xconfig.js',
        },
      };
      setupCase();
      // When
      const sut = jimpex(customOptions);
      // Then
      expect(sut).toBeInstanceOf(Jimpex);
      expect(sut.options).toEqual(expect.objectContaining(customOptions));
    });
  });
});
