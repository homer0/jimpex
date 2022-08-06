import type { SimpleConfig } from './wootils';
import type { Jimpex } from '../app';
/**
 * The options for the application's configuration service.
 *
 * @see {@link https://www.npmjs.com/package/@homer0/simple-config}
 */
export type JimpexConfigurationOptions = {
  /**
   * The default settings for the configuration. If no external configuration is used,
   * this needs to include a `port` property.
   */
  default: unknown;
  /**
   * The name of the application, used for external configuration files.
   *
   * @default 'app'
   */
  name: string;
  /**
   * The path to where external configuration files are stored. Relative to the project
   * root.
   *
   * @default 'config/'
   */
  path: string;
  /**
   * Whether the configuration files are inside a sub directory or not. If `true`, a
   * configuration path would be `config/[app-name]/[file]`.
   *
   * @default false
   */
  hasFolder: boolean;
  /**
   * Whether or not to check for the environment variable and load a configuration file
   * based on its value.
   *
   * @default true
   */
  loadFromEnvironment: boolean;
  /**
   * The name of the environment variable that will be used to set the active
   * configuration.
   *
   * @default 'CONFIG'
   */
  environmentVariable: string;
  /**
   * The name of the default configuration file.
   *
   * @default '[app-name].config.js'
   */
  defaultConfigFilename: string;
  /**
   * The name format of other external configuration files.
   *
   * @default '[app-name].[configuration-name].config.js'
   */
  filenameFormat: string;
};
/**
 * The options for the middleware that serves static files.
 */
export type JimpexStaticsOptions = {
  /**
   * Whether or not to enable the middleware.
   *
   * @default true
   */
  enabled: boolean;
  /**
   * If `true`, the path to the statics folder will be relative to the project root
   * directory, otherwise, it will be relative to the directory where the app executable
   * file is located.
   *
   * @default false
   */
  onHome: boolean;
  /**
   * The name of both the route and the folder, relative to whatever you defined with the
   * `onHome` option.
   *
   * @default 'statics'
   */
  route: string;
  /**
   * By default, the folder will be the same as the `route`,
   * but you can use this option to define a relative path that won't affect the route.
   *
   * @default ''
   * @todo Make optional.
   */
  folder: string;
};
/**
 * The options for the Express application.
 */
export type JimpexExpressOptions = {
  /**
   * Whether or not to enable the `trust proxy` option.
   *
   * @default true
   */
  trustProxy: boolean;
  /**
   * Whether or not to remove the `x-powered-by` header.
   *
   * @default true
   */
  disableXPoweredBy: boolean;
  /**
   * Whether or not to add the `compression` middleware.
   *
   * @default true
   */
  compression: boolean;
  /**
   * Whether or not to add the `body-parser` middleware.
   *
   * @default true
   */
  bodyParser: boolean;
  /**
   * Whether or not to add the `multer` middleware.
   *
   * @see {@link https://www.npmjs.com/package/multer}
   */
  multer: boolean;
};
/**
 * The options to configure the application executable path.
 */
export type JimpexPathOptions = {
  /**
   * A "hardcoded" path to the application executable file.
   *
   * @default ''
   * @todo Make optional.
   */
  appPath: string;
  /**
   * If `true`, it will try to figure out the parent file path, and use its directory as
   * the path.
   *
   * @default true
   */
  useParentPath: boolean;
};
/**
 * The options to enable some of the default services Jimpex comes with.
 */
export type JimpexServicesOptions = {
  /**
   * Whether or not to register all the `common` services: `appError`, `httpError`, and
   * `sendFile`.
   *
   * @default true
   */
  common: boolean;
  /**
   * Whether or not to register the `http` services: `apiClient`, `http`, and
   * `responsesBuilder`.
   *
   * @default true
   */
  http: boolean;
  /**
   * Whether or not to register the `utils` services: `ensureBearerToken`.
   */
  utils: boolean;
};
/**
 * The format in which the application's health status can be returned.
 * It's either a simple boolean, or a more detailed object.
 */
export type JimpexHealthStatus =
  | boolean
  | {
      isHealthy?: boolean;
      services?: Record<string, boolean>;
    };
/**
 * Returns the application health status. This is normally used by the `healthController`.
 */
export type JimpexHealthCheckFn = (app: Jimpex) => Promise<JimpexHealthStatus>;
/**
 * The options to create a new instance of Jimpex.
 */
export type JimpexOptions = {
  /**
   * The application's version.
   *
   * @default '0.0.0'
   * @todo Remove.
   */
  version: string;
  /**
   * The size limit for the requests payload.
   *
   * @default '15MB'
   */
  filesizeLimit: string;
  /**
   * Whether or not to call the `boot` method after initialization. This is useful if you
   * want to register/overwrite services only on certain contexts, like a dev environment.
   *
   * @default true
   */
  boot: boolean;
  /**
   * Old proxy mode.
   *
   * @default false
   * @todo Remove.
   */
  path: JimpexPathOptions;
  /**
   * Options for the configuration service.
   *
   * @see {@link https://www.npmjs.com/package/@homer0/simple-config}
   */
  configuration: JimpexConfigurationOptions;
  /**
   * Options for the middleware that serves static files.
   */
  statics: JimpexStaticsOptions;
  /**
   * Options for the Express application.
   */
  express: JimpexExpressOptions;
  /**
   * Options to manage the default services.
   */
  services: JimpexServicesOptions;
  /**
   * A function that will be used to check the application health status.
   */
  healthCheck: JimpexHealthCheckFn;
};
/**
 * The function called when the application starts listening for requests.
 */
export type JimpexStartCallback = (config: SimpleConfig) => void;
