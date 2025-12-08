vi.mock('https');
vi.mock('express');
vi.mock('compression');
vi.mock('body-parser', () => ({
  default: {
    json: vi.fn(),
    urlencoded: vi.fn(),
  },
}));
vi.mock('multer');
vi.mock('@homer0/simple-logger');
vi.mock('@homer0/path-utils', () => ({
  pathUtilsProvider: {
    register: vi.fn(),
    provider: true,
  },
}));
vi.mock('@homer0/simple-config');
vi.mock('@homer0/env-utils', () => ({
  envUtilsProvider: {
    register: vi.fn(),
    provider: true,
  },
}));
vi.mock('@homer0/package-info', () => ({
  packageInfoProvider: {
    register: vi.fn(),
    provider: true,
  },
}));
vi.mock('@homer0/root-file', () => ({
  rootFileProvider: {
    register: vi.fn(),
    provider: true,
  },
}));

import { vi } from 'vitest';
import originalHTTPS from 'https';
import originalExpress from 'express';
import originalCompression from 'compression';
import originalBodyParser from 'body-parser';
import originalMulter from 'multer';
import type { Mock, MockedObject, MockInstance } from 'vitest';
import { appLoggerProvider as originalAppLoggerProvider } from '@homer0/simple-logger';
import { envUtilsProvider as originalEnvUtilsProvider } from '@homer0/env-utils';
import { packageInfoProvider as originalPackageInfoProvider } from '@homer0/package-info';
import { pathUtilsProvider as originalPathUtilsProvider } from '@homer0/path-utils';
import { rootFileProvider as originalRootFileProvider } from '@homer0/root-file';
import {
  SimpleConfig,
  simpleConfigProvider as originalSimpleConfigProvider,
} from '@homer0/simple-config';
import type { Express, ExpressMiddleware, Router } from '@src/types/index.js';
import type { Jimpex } from '@src/app/jimpex.js';
import {
  commonServicesProvider,
  httpServicesProvider,
  utilsServicesProvider,
} from '@src/services/index.js';
import {
  getPathUtilsMock,
  type PathUtilsMockOptions,
  type PathUtilsMockMocks,
} from './pathUtils.js';
import { getLoggerMock, type LoggerMockMocks } from './logger.js';
import { getConfigMock, type ConfigMockMocks } from './config.js';

export const https = originalHTTPS as unknown as MockedObject<typeof originalHTTPS>;

export const express = originalExpress as unknown as MockInstance<
  typeof originalExpress
> & {
  Router: Mock<() => Router>;
  static: Mock<(a: string) => unknown>;
};

export const compression = originalCompression as unknown as MockInstance<
  typeof originalCompression
>;
export const bodyParser = originalBodyParser as unknown as {
  json: Mock;
  urlencoded: Mock;
};

export const multer = originalMulter as unknown as MockInstance<typeof originalMulter>;

export const appLoggerProvider = originalAppLoggerProvider as unknown as MockInstance<
  typeof originalAppLoggerProvider
>;

export const pathUtilsProvider = originalPathUtilsProvider as unknown as {
  register: Mock<(a: Jimpex) => void>;
};

export const envUtilsProvider = originalEnvUtilsProvider as unknown as {
  register: Mock<(a: Jimpex) => void>;
};

export const packageInfoProvider = originalPackageInfoProvider as unknown as {
  register: Mock<(a: Jimpex) => void>;
};

export const rootFileProvider = originalRootFileProvider as unknown as {
  register: Mock<(a: Jimpex) => void>;
};

export const simpleConfigProvider =
  originalSimpleConfigProvider as unknown as MockInstance<
    typeof originalSimpleConfigProvider
  >;

export const resetDependencies = (): void => {
  https.createServer.mockReset();
  express.mockReset();
  express.Router.mockReset();
  express.static.mockReset();
  compression.mockReset();
  bodyParser.json.mockReset();
  bodyParser.urlencoded.mockReset();
  multer.mockReset();
  appLoggerProvider.mockReset();
  simpleConfigProvider.mockReset();
  pathUtilsProvider.register.mockReset();
  envUtilsProvider.register.mockReset();
  packageInfoProvider.register.mockReset();
  rootFileProvider.register.mockReset();
};

export type SetupExpressResult = {
  expressMocks: {
    enable: Mock<() => void>;
    disable: Mock<() => void>;
    use: Mock<(a: ExpressMiddleware) => void>;
    listen: Mock<(a: number, b: () => void) => { close: Mock<() => void> }>;
  };
  instanceMock: {
    close: Mock<() => void>;
  };
  routerMock: Mock<typeof originalExpress.Router>;
  staticMock: Mock<(a: string) => unknown>;
  compressionMock: typeof compression;
  multerMocks: {
    multer: typeof multer;
    any: Mock<() => { multerAny: boolean }>;
  };
  bodyParserMocks: {
    json: Mock<() => void>;
    urlencoded: Mock<() => void>;
  };
};

export const setupExpress = (): SetupExpressResult => {
  const close = vi.fn();
  const instanceMock = {
    express: true,
    close,
  };
  const expressMocks = {
    express: true,
    enable: vi.fn(),
    disable: vi.fn(),
    use: vi.fn(),
    listen: vi.fn((_: number, cb: () => void) => {
      cb();
      return instanceMock;
    }),
  };
  express.mockReturnValueOnce(expressMocks as unknown as Express);
  const expressRouterInstance = {
    router: true,
  };
  express.Router.mockReturnValue(expressRouterInstance as unknown as Router);
  const expressStaticInstance = {
    static: true,
  };
  express.static.mockReturnValue(expressStaticInstance);
  const compressionInstance = {
    compression: true,
  };
  compression.mockReturnValueOnce(
    compressionInstance as unknown as ReturnType<typeof originalCompression>,
  );
  const bodyParserJsonInstance = {
    json: true,
  };
  bodyParser.json.mockReturnValueOnce(bodyParserJsonInstance);
  const bodyParserUrlencodedInstance = {
    urlencoded: true,
  };
  bodyParser.urlencoded.mockReturnValueOnce(bodyParserUrlencodedInstance);
  const multerAnyInstance = {
    multerAny: true,
  };
  const multerInstance = {
    any: vi.fn(() => multerAnyInstance),
  };
  multer.mockReturnValueOnce(
    multerInstance as unknown as ReturnType<typeof originalMulter>,
  );

  return {
    expressMocks,
    instanceMock,
    routerMock: express.Router,
    staticMock: express.static,
    compressionMock: compression,
    multerMocks: {
      multer,
      any: multerInstance.any,
    },
    bodyParserMocks: {
      json: bodyParser.json,
      urlencoded: bodyParser.urlencoded,
    },
  };
};

export type SetupWootilsOptions = {
  pathUtils?: PathUtilsMockOptions;
};

export type SetupWootilsResult = {
  pathUtilsMocks: PathUtilsMockMocks;
  loggerMocks: LoggerMockMocks;
  configMocks: ConfigMockMocks;
  config: SimpleConfig;
};

export const setupWootils = (options: SetupWootilsOptions = {}): SetupWootilsResult => {
  const { pathUtils: pathUtilsOptions = {} } = options;
  const { pathUtils, pathUtilsMocks } = getPathUtilsMock(pathUtilsOptions);
  pathUtilsProvider.register.mockImplementationOnce((c) =>
    c.set('pathUtils', () => pathUtils),
  );
  const { logger, loggerMocks } = getLoggerMock();
  appLoggerProvider.mockReturnValueOnce({
    register: (c) => c.set('logger', () => logger),
    provider: true,
  });
  const { config, configMocks } = getConfigMock();
  simpleConfigProvider.mockReturnValueOnce({
    register: (c) => c.set('config', () => config),
    provider: true,
  });

  return {
    pathUtilsMocks,
    loggerMocks,
    configMocks,
    config,
  };
};

export type SetupServicesOptions = {
  commonServicesRegister?: (c: Jimpex) => void;
  httpServicesRegister?: (c: Jimpex) => void;
  utilsServicesRegister?: (c: Jimpex) => void;
};

export type SetupServices = {
  commonServices: Mock<(a: Jimpex) => void>;
  httpServices: Mock<(a: Jimpex) => void>;
  utilsServices: Mock<(a: Jimpex) => void>;
};

export const setupServices = (options: SetupServicesOptions = {}): SetupServices => {
  const {
    commonServicesRegister = () => {},
    httpServicesRegister = () => {},
    utilsServicesRegister = () => {},
  } = options;
  const mocks = {
    commonServices: vi
      .spyOn(commonServicesProvider, 'register')
      .mockClear()
      .mockImplementationOnce(commonServicesRegister),
    httpServices: vi
      .spyOn(httpServicesProvider, 'register')
      .mockClear()
      .mockImplementationOnce(httpServicesRegister),
    utilsServices: vi
      .spyOn(utilsServicesProvider, 'register')
      .mockClear()
      .mockImplementationOnce(utilsServicesRegister),
  };

  return mocks;
};

export type SetupCaseOptions = {
  wootils?: SetupWootilsOptions;
  services?: SetupServicesOptions;
};

export type SetupCaseResults = {
  express: SetupExpressResult;
  wootils: SetupWootilsResult;
  services: SetupServices;
};

export const setupCase = (options: SetupCaseOptions = {}): SetupCaseResults => {
  const expressSetup = setupExpress();
  const wootilsSetup = setupWootils(options.wootils);
  const servicesSetup = setupServices(options.services);
  return {
    express: expressSetup,
    wootils: wootilsSetup,
    services: servicesSetup,
  };
};
