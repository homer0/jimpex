import type { Server as HTTPSServer } from 'https';
import type { Server as HTTPServer } from 'http';
import type { ServerOptions as SpdyServerOptions } from 'spdy';
import type { Express } from './express';

export type JimpexServer = Express | HTTPSServer;
export type JimpexServerInstance = HTTPServer | HTTPSServer;

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
