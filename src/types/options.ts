import type { SimpleConfig } from './wootils';
import type { Jimpex } from '../app';

export type JimpexConfigurationOptions = {
  default: unknown;
  name: string;
  path: string;
  hasFolder: boolean;
  environmentVariable: string;
  loadFromEnvironment: boolean;
  defaultConfigFilename: string;
  filenameFormat: string;
};

export type JimpexStaticsOptions = {
  enabled: boolean;
  onHome: boolean;
  route: string;
  folder: string;
};

export type JimpexExpressOptions = {
  trustProxy: boolean;
  disableXPoweredBy: boolean;
  compression: boolean;
  bodyParser: boolean;
  multer: boolean;
};

export type JimpexPathOptions = {
  appPath: string;
  useParentPath: boolean;
};

export type JimpexServicesOptions = {
  common: boolean;
  http: boolean;
  utils: boolean;
};

export type JimpexHealthStatus =
  | boolean
  | {
      isHealthy?: boolean;
      services?: Record<string, boolean>;
    };

export type JimpexHealthCheckFn = (app: Jimpex) => Promise<JimpexHealthStatus>;

export type JimpexOptions = {
  version: string;
  filesizeLimit: string;
  boot: boolean;
  proxy: boolean;
  path: JimpexPathOptions;
  configuration: JimpexConfigurationOptions;
  statics: JimpexStaticsOptions;
  express: JimpexExpressOptions;
  services: JimpexServicesOptions;
  healthCheck: JimpexHealthCheckFn;
};

export type JimpexStartCallback = (config: SimpleConfig) => void;
