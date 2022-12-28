import {
  HealthController,
  healthController,
  type HealthControllerOptions,
  type GetHealthStatus,
} from '@src/controllers/common/health';
import { type Statuses } from '@src/utils';
import type { ResponsesBuilder } from '@src/services';
import type {
  ExpressMiddleware,
  JimpexHealthStatus,
  Request,
  Response,
} from '@src/types';
import { getJimpexMock, getConfigMock, getRouterMock } from '@tests/mocks';

describe('controllers/common:health', () => {
  describe('class', () => {
    it('should be instantiated', () => {
      // Given
      const { config } = getConfigMock();
      const options: HealthControllerOptions = {
        inject: {
          config,
          getHealthStatus: (() => {}) as GetHealthStatus,
          responsesBuilder: {} as ResponsesBuilder,
          statuses: {} as Statuses,
        },
      };
      // When
      const sut = new HealthController(options);
      // Then
      expect(sut).toBeInstanceOf(HealthController);
    });

    describe('handler:showHealth', () => {
      it('should respond that the app is healthy', async () => {
        // Given
        const { config, configMocks } = getConfigMock();
        const configName = 'default';
        const configVersion = 'dev';
        configMocks.get.mockReturnValueOnce({
          name: configName,
          version: configVersion,
        });
        const status = 200;
        const statuses = jest.fn(() => status);
        const responsesBuilder = {
          json: jest.fn(),
        };
        const getHealthStatus = jest.fn().mockResolvedValueOnce(true);
        const options: HealthControllerOptions = {
          inject: {
            config,
            getHealthStatus,
            responsesBuilder: responsesBuilder as unknown as ResponsesBuilder,
            statuses: statuses as unknown as Statuses,
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
        const sut = new HealthController(options);
        await sut.showHealth()(request, response, next);
        // Then
        expect(getHealthStatus).toHaveBeenCalledTimes(1);
        expect(configMocks.get).toHaveBeenCalledTimes(1);
        expect(configMocks.get).toHaveBeenCalledWith(['name', 'version']);
        expect(statuses).toHaveBeenCalledTimes(1);
        expect(statuses).toHaveBeenCalledWith('ok');
        expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          status,
          data: {
            isHealthy: true,
            status,
            config: configName,
            version: configVersion,
          },
        });
      });

      it('should respond that the app is healthy and report on services', async () => {
        // Given
        const { config, configMocks } = getConfigMock();
        const configName = 'default';
        const configVersion = 'dev';
        configMocks.get.mockReturnValueOnce({
          name: configName,
          version: configVersion,
        });
        const status = 200;
        const statuses = jest.fn(() => status);
        const responsesBuilder = {
          json: jest.fn(),
        };
        const healthStatus: JimpexHealthStatus = {
          isHealthy: true,
          services: {
            redis: true,
            mongo: true,
          },
        };
        const getHealthStatus = jest.fn().mockResolvedValueOnce(healthStatus);
        const options: HealthControllerOptions = {
          inject: {
            config,
            getHealthStatus,
            responsesBuilder: responsesBuilder as unknown as ResponsesBuilder,
            statuses: statuses as unknown as Statuses,
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
        const sut = new HealthController(options);
        await sut.showHealth()(request, response, next);
        // Then
        expect(statuses).toHaveBeenCalledTimes(1);
        expect(statuses).toHaveBeenCalledWith('ok');
        expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          status,
          data: {
            isHealthy: true,
            status,
            config: configName,
            version: configVersion,
            ...healthStatus.services,
          },
        });
      });

      it('should respond that the app health based on the services statuses', async () => {
        // Given
        const { config, configMocks } = getConfigMock();
        const configName = 'default';
        const configVersion = 'dev';
        configMocks.get.mockReturnValueOnce({
          name: configName,
          version: configVersion,
        });
        const status = 503;
        const statuses = jest.fn(() => status);
        const responsesBuilder = {
          json: jest.fn(),
        };
        const healthStatus: JimpexHealthStatus = {
          services: {
            redis: true,
            mongo: false,
          },
        };
        const getHealthStatus = jest.fn().mockResolvedValueOnce(healthStatus);
        const options: HealthControllerOptions = {
          inject: {
            config,
            getHealthStatus,
            responsesBuilder: responsesBuilder as unknown as ResponsesBuilder,
            statuses: statuses as unknown as Statuses,
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
        const sut = new HealthController(options);
        await sut.showHealth()(request, response, next);
        // Then
        expect(statuses).toHaveBeenCalledTimes(1);
        expect(statuses).toHaveBeenCalledWith('service unavailable');
        expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          status,
          data: {
            isHealthy: false,
            status,
            config: configName,
            version: configVersion,
            ...healthStatus.services,
          },
        });
      });

      it('should respond that the app is healthy if the information is incomplete', async () => {
        // Given
        const { config, configMocks } = getConfigMock();
        const configName = 'default';
        const configVersion = 'dev';
        configMocks.get.mockReturnValueOnce({
          name: configName,
          version: configVersion,
        });
        const status = 200;
        const statuses = jest.fn(() => status);
        const responsesBuilder = {
          json: jest.fn(),
        };
        const getHealthStatus = jest.fn().mockResolvedValueOnce({});
        const options: HealthControllerOptions = {
          inject: {
            config,
            getHealthStatus,
            responsesBuilder: responsesBuilder as unknown as ResponsesBuilder,
            statuses: statuses as unknown as Statuses,
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
        const sut = new HealthController(options);
        await sut.showHealth()(request, response, next);
        // Then
        expect(statuses).toHaveBeenCalledTimes(1);
        expect(statuses).toHaveBeenCalledWith('ok');
        expect(responsesBuilder.json).toHaveBeenCalledTimes(1);
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          status,
          data: {
            isHealthy: true,
            status,
            config: configName,
            version: configVersion,
          },
        });
      });

      it('should respond that the app is not healthy', async () => {
        // Given
        const { config, configMocks } = getConfigMock();
        const configName = 'default';
        const configVersion = 'dev';
        configMocks.get.mockReturnValueOnce({
          name: configName,
          version: configVersion,
        });
        const status = 503;
        const statuses = jest.fn(() => status);
        const responsesBuilder = {
          json: jest.fn(),
        };
        const getHealthStatus = jest.fn().mockResolvedValueOnce(false);
        const options: HealthControllerOptions = {
          inject: {
            config,
            getHealthStatus,
            responsesBuilder: responsesBuilder as unknown as ResponsesBuilder,
            statuses: statuses as unknown as Statuses,
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
        const sut = new HealthController(options);
        await sut.showHealth()(request, response, next);
        // Then
        expect(statuses).toHaveBeenCalledWith('service unavailable');
        expect(responsesBuilder.json).toHaveBeenCalledWith({
          res: response,
          status,
          data: {
            isHealthy: false,
            status,
            config: configName,
            version: configVersion,
          },
        });
      });
    });
  });

  describe('controller', () => {
    it('should register the route', () => {
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
      const result = healthController.connect(container, '/health');
      const toCompare = new HealthController({
        inject: {
          config,
          getHealthStatus: (() => {}) as GetHealthStatus,
          responsesBuilder: {} as ResponsesBuilder,
          statuses: {} as Statuses,
        },
      });
      const [[, rootMiddleware]] = routerMocks.get.mock.calls as unknown as [
        [string, ExpressMiddleware],
      ];
      // Then
      expect(result).toBe(router);
      expect(mocks.get).toHaveBeenCalledTimes(4);
      expect(mocks.get).toHaveBeenNthCalledWith(1, 'router');
      expect(mocks.get).toHaveBeenNthCalledWith(2, 'responsesBuilder');
      expect(mocks.get).toHaveBeenNthCalledWith(3, 'config');
      expect(mocks.get).toHaveBeenNthCalledWith(4, 'statuses');
      expect(routerMocks.get).toHaveBeenCalledTimes(1);
      expect(routerMocks.get).toHaveBeenNthCalledWith(1, '/', expect.any(Function));
      expect(rootMiddleware.toString()).toBe(toCompare.showHealth().toString());
    });
  });
});
