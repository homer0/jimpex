jest.mock('https');
jest.mock('spdy');
jest.mock('express');
jest.mock('compression');
jest.mock('body-parser', () => ({
  json: jest.fn(),
  urlencoded: jest.fn(),
}));
jest.mock('multer');
jest.mock('@homer0/simple-logger');
jest.mock('@homer0/path-utils', () => ({
  pathUtilsProvider: {
    register: jest.fn(),
    provider: true,
  },
}));
jest.mock('@homer0/simple-config');
jest.mock('@homer0/env-utils', () => ({
  envUtilsProvider: {
    register: jest.fn(),
    provider: true,
  },
}));
jest.mock('@homer0/package-info', () => ({
  packageInfoProvider: {
    register: jest.fn(),
    provider: true,
  },
}));
jest.mock('@homer0/root-file', () => ({
  rootFileProvider: {
    register: jest.fn(),
    provider: true,
  },
}));

import originalHTTPS from 'https';
import originalSpdy from 'spdy';
import originalExpress from 'express';
import originalCompression from 'compression';
import originalBodyParser from 'body-parser';
import originalMulter from 'multer';
import { appLoggerProvider as originalAppLoggerProvider } from '@homer0/simple-logger';
import { envUtilsProvider as originalEnvUtilsProvider } from '@homer0/env-utils';
import { packageInfoProvider as originalPackageInfoProvider } from '@homer0/package-info';
import { pathUtilsProvider as originalPathUtilsProvider } from '@homer0/path-utils';
import { rootFileProvider as originalRootFileProvider } from '@homer0/root-file';
import {
  SimpleConfig,
  simpleConfigProvider as originalSimpleConfigProvider,
} from '@homer0/simple-config';
import type { Express, ExpressMiddleware, Router } from '@src/types';
import type { Jimpex } from '@src/app/jimpex';
import {
  commonServicesProvider,
  httpServicesProvider,
  utilsServicesProvider,
} from '@src/services';
import {
  getPathUtilsMock,
  type PathUtilsMockOptions,
  type PathUtilsMockMocks,
} from './pathUtils';
import { getLoggerMock, type LoggerMockMocks } from './logger';
import { getConfigMock, type ConfigMockMocks } from './config';

export const https = originalHTTPS as unknown as jest.Mocked<typeof originalHTTPS>;
export const spdy = originalSpdy as unknown as jest.Mocked<typeof originalSpdy>;

export const express = originalExpress as unknown as jest.MockInstance<
  ReturnType<typeof originalExpress>,
  jest.ArgsType<typeof originalExpress>
> & {
  Router: jest.Mock<Router, []>;
  static: jest.Mock<unknown, [string]>;
};

export const compression = originalCompression as unknown as jest.MockInstance<
  ReturnType<typeof originalCompression>,
  jest.ArgsType<typeof originalCompression>
>;
export const bodyParser = originalBodyParser as unknown as {
  json: jest.Mock;
  urlencoded: jest.Mock;
};

export const multer = originalMulter as unknown as jest.MockInstance<
  ReturnType<typeof originalMulter>,
  jest.ArgsType<typeof originalMulter>
>;

export const appLoggerProvider =
  originalAppLoggerProvider as unknown as jest.MockInstance<
    ReturnType<typeof originalAppLoggerProvider>,
    jest.ArgsType<typeof originalAppLoggerProvider>
  >;

export const pathUtilsProvider = originalPathUtilsProvider as unknown as {
  register: jest.Mock<void, [Jimpex]>;
};

export const envUtilsProvider = originalEnvUtilsProvider as unknown as {
  register: jest.Mock<void, [Jimpex]>;
};

export const packageInfoProvider = originalPackageInfoProvider as unknown as {
  register: jest.Mock<void, [Jimpex]>;
};

export const rootFileProvider = originalRootFileProvider as unknown as {
  register: jest.Mock<void, [Jimpex]>;
};

export const simpleConfigProvider =
  originalSimpleConfigProvider as unknown as jest.MockInstance<
    ReturnType<typeof originalSimpleConfigProvider>,
    jest.ArgsType<typeof originalSimpleConfigProvider>
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
    enable: jest.Mock<void, []>;
    disable: jest.Mock<void, []>;
    use: jest.Mock<void, [ExpressMiddleware]>;
    listen: jest.Mock<{ close: jest.Mock<void, []> }, [number, () => void]>;
  };
  instanceMock: {
    close: jest.Mock<void, []>;
  };
  routerMock: jest.Mock<
    ReturnType<typeof originalExpress.Router>,
    Parameters<typeof originalExpress.Router>
  >;
  staticMock: jest.Mock<unknown, [string]>;
  compressionMock: typeof compression;
  multerMocks: {
    multer: typeof multer;
    any: jest.Mock<{ multerAny: boolean }, []>;
  };
  bodyParserMocks: {
    json: jest.Mock<void, []>;
    urlencoded: jest.Mock<void, []>;
  };
};

export const setupExpress = (): SetupExpressResult => {
  const close = jest.fn();
  const instanceMock = {
    express: true,
    close,
  };
  const expressMocks = {
    express: true,
    enable: jest.fn(),
    disable: jest.fn(),
    use: jest.fn(),
    listen: jest.fn((_: number, cb: () => void) => {
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
    any: jest.fn(() => multerAnyInstance),
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
  commonServices: jest.SpyInstance<void, [Jimpex]>;
  httpServices: jest.SpyInstance<void, [Jimpex]>;
  utilsServices: jest.SpyInstance<void, [Jimpex]>;
};

export const setupServices = (options: SetupServicesOptions = {}): SetupServices => {
  const {
    commonServicesRegister = () => {},
    httpServicesRegister = () => {},
    utilsServicesRegister = () => {},
  } = options;
  const mocks = {
    commonServices: jest
      .spyOn(commonServicesProvider, 'register')
      .mockClear()
      .mockImplementationOnce(commonServicesRegister),
    httpServices: jest
      .spyOn(httpServicesProvider, 'register')
      .mockClear()
      .mockImplementationOnce(httpServicesRegister),
    utilsServices: jest
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
