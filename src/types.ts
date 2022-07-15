import type { Server as HTTPSServer } from 'https';
import type { Server as HTTPServer } from 'http';
import type { Express, Router, RequestHandler, ErrorRequestHandler } from 'express';
import type { PathUtils } from '@homer0/path-utils';
import type { ServerOptions as SpdyServerOptions } from 'spdy';
import type { SimpleLogger } from '@homer0/simple-logger';
import type { SimpleConfig } from '@homer0/simple-config';

export type { Express, Router, PathUtils, SimpleLogger, SimpleConfig, SpdyServerOptions };

export type Dict = Record<string, unknown>;

export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
    ? DeepPartial<T[P]>
    : T[P];
};

export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? DeepReadonly<U>[]
    : T[P] extends object
    ? DeepReadonly<T[P]>
    : T[P];
};

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
  configuration: JimpexConfigurationOptions;
  statics: JimpexStaticsOptions;
  express: JimpexExpressOptions;
  services: JimpexServicesOptions;
};

export type JimpexHTTPSCredentials = {
  ca?: string;
  cert?: string;
  key?: string;
};

export type JimpexHTTP2Options = {
  enabled?: boolean;
  spdy?: SpdyServerOptions['spdy'];
};

export type JimpexHTTPSOptions = {
  enabled?: boolean;
  credentials?: JimpexHTTPSCredentials & {
    onHome?: boolean;
  };
};

export type JimpexStartCallback = (config: SimpleConfig) => void;
export type JimpexServer = Express | HTTPSServer;
export type JimpexServerInstance = HTTPServer | HTTPSServer;

export type JimpexLifeCycleEvent =
  | 'beforeStart'
  | 'start'
  | 'afterStart'
  | 'afterStartCallback'
  | 'beforeStop'
  | 'stop'
  | 'afterStop';
export type JimpexActionEvent = 'routeAdded';
export type JimpexEventName = JimpexLifeCycleEvent | JimpexActionEvent;
export type JimpexEventPayload<EventName extends JimpexEventName> =
  EventName extends 'routeAdded' ? { route: string } : undefined;

export type ExpressMiddleware = RequestHandler | ErrorRequestHandler;
