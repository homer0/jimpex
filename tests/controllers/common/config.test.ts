import {
  ConfigController,
  configController,
  type ConfigControllerOptions,
} from '@src/controllers/common/config';
import type { ResponsesBuilder } from '@src/services';
import type { ExpressMiddleware, Request, Response } from '@src/types';
import { getJimpexMock, getConfigMock, getRouterMock } from '@tests/mocks';

describe('controllers/common:config', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const { config } = getConfigMock();
      const options: ConfigControllerOptions = {
        inject: {
          config,
          responsesBuilder: {} as ResponsesBuilder,
        },
      };
      // When
      const sut = new ConfigController(options);
      // Then
      expect(sut).toBeInstanceOf(ConfigController);
    });

    describe('handler:showConfig', () => {
      it('should respond with the current configuration', () => {
        // Given
        const configName = 'default';
        const configValues = {
          names: ['charo', 'pili'],
        };
        const { config, configMocks } = getConfigMock();
        configMocks.get.mockReturnValueOnce(configName);
        configMocks.getConfig.mockReturnValueOnce(configValues);
        const responsesBuilder = {
          json: jest.fn(),
        };
        const options: ConfigControllerOptions = {
          inject: {
            config,
            responsesBuilder: responsesBuilder as unknown as ResponsesBuilder,
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new ConfigController(options);
        sut.showConfig()(request, response, next);
        // Then
        expect(configMocks.get).toHaveBeenCalledTimes(1);
        expect(configMocks.get).toHaveBeenCalledWith('name');
        expect(configMocks.getConfig).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          data: {
            name: configName,
            ...configValues,
          },
        });
      });
    });

    describe('handler:switchConfig', () => {
      it('should switch configs', async () => {
        // Given
        const configName = 'newConfig';
        const configValues = {
          names: ['charo', 'pili'],
        };
        const { config, configMocks } = getConfigMock();
        configMocks.get.mockReturnValueOnce(configName);
        configMocks.getConfig.mockReturnValueOnce(configValues);
        configMocks.canSwitchConfigs.mockReturnValueOnce(true);
        configMocks.switch.mockImplementationOnce(() => Promise.resolve());
        const responsesBuilder = {
          json: jest.fn(),
        };
        const options: ConfigControllerOptions = {
          inject: {
            config,
            responsesBuilder: responsesBuilder as unknown as ResponsesBuilder,
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: {
            name: configName,
          },
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new ConfigController(options);
        await sut.switchConfig()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(0);
        expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          data: {
            name: configName,
            ...configValues,
          },
        });
      });

      it("shouldn't switch configs if no name is specified", async () => {
        // Given
        const { config } = getConfigMock();
        const responsesBuilder = {
          json: jest.fn(),
        };
        const options: ConfigControllerOptions = {
          inject: {
            config,
            responsesBuilder: responsesBuilder as unknown as ResponsesBuilder,
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: {},
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new ConfigController(options);
        await sut.switchConfig()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
        expect(responsesBuilder.json).toHaveBeenCalledTimes(0);
      });

      it("shouldn't switch configs if not enabled", async () => {
        // Given
        const { config, configMocks } = getConfigMock();
        configMocks.canSwitchConfigs.mockReturnValueOnce(false);
        const responsesBuilder = {
          json: jest.fn(),
        };
        const options: ConfigControllerOptions = {
          inject: {
            config,
            responsesBuilder: responsesBuilder as unknown as ResponsesBuilder,
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const request = {
          request: true,
          params: {
            name: 'newConfig',
          },
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new ConfigController(options);
        await sut.switchConfig()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith();
        expect(configMocks.canSwitchConfigs).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledTimes(0);
      });

      it('should throw an error when trying to switch configs', async () => {
        // Given
        const { config, configMocks } = getConfigMock();
        configMocks.canSwitchConfigs.mockReturnValueOnce(true);
        const switchError = new Error('switch error');
        configMocks.switch.mockImplementationOnce(() => Promise.reject(switchError));
        const responsesBuilder = {
          json: jest.fn(),
        };
        const options: ConfigControllerOptions = {
          inject: {
            config,
            responsesBuilder: responsesBuilder as unknown as ResponsesBuilder,
          },
        };
        const response = {
          response: true,
        } as unknown as Response;
        const newConfigName = 'newConfig';
        const request = {
          request: true,
          params: {
            name: newConfigName,
          },
        } as unknown as Request;
        const next = jest.fn();
        // When
        const sut = new ConfigController(options);
        await sut.switchConfig()(request, response, next);
        // Then
        expect(next).toHaveBeenCalledTimes(1);
        expect(next).toHaveBeenCalledWith(switchError);
        expect(configMocks.switch).toHaveBeenCalledTimes(1);
        expect(configMocks.switch).toHaveBeenCalledWith(newConfigName);
        expect(responsesBuilder.json).toHaveBeenCalledTimes(0);
      });
    });
  });

  describe('controller', () => {
    it('should register routes when enabled', () => {
      // Given
      const { router, routerMocks } = getRouterMock();
      const { config, configMocks } = getConfigMock();
      configMocks.get.mockReturnValueOnce(true);
      const { container, containerMocks: mocks } = getJimpexMock({
        resources: {
          config,
          router,
        },
      });
      // When
      const result = configController.connect(container, '/config');
      const toCompare = new ConfigController({
        inject: {
          config,
          responsesBuilder: {} as ResponsesBuilder,
        },
      });
      const [[, rootMiddleware], [, switchMiddleware]] = routerMocks.get.mock
        .calls as unknown as [[string, ExpressMiddleware], [string, ExpressMiddleware]];
      // Then
      expect(result).toBe(router);
      expect(mocks.get).toHaveBeenCalledTimes(3);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'router');
      expect(mocks.get).toHaveBeenNthCalledWith(3, 'responsesBuilder');
      expect(configMocks.get).toHaveBeenCalledTimes(1);
      expect(configMocks.get).toHaveBeenCalledWith('debug.configController');
      expect(routerMocks.get).toHaveBeenCalledTimes(2);
      expect(routerMocks.get).toHaveBeenNthCalledWith(1, '/', expect.any(Function));
      expect(routerMocks.get).toHaveBeenNthCalledWith(
        2,
        '/switch/:name',
        expect.any(Function),
      );
      expect(rootMiddleware.toString()).toBe(toCompare.showConfig().toString());
      expect(switchMiddleware.toString()).toBe(toCompare.switchConfig().toString());
    });

    it("shouldn't register routes when disabled", () => {
      // Given
      const { router, routerMocks } = getRouterMock();
      const { config, configMocks } = getConfigMock();
      configMocks.get.mockReturnValueOnce(false);
      const { container } = getJimpexMock({
        resources: {
          config,
          router,
        },
      });
      // When
      const result = configController.connect(container, '/config');
      // Then
      expect(result).toBe(router);
      expect(routerMocks.get).toHaveBeenCalledTimes(0);
    });
  });
});
