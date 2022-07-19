import type { SimpleConfig } from './wootils';

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
};

export type JimpexStartCallback = (config: SimpleConfig) => void;
