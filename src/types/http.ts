import type { Server as HTTPSServer } from 'https';
import type { Server as HTTPServer } from 'http';
import type { ServerOptions as SpdyServerOptions } from 'spdy';
import type NodeFetchFn from 'node-fetch';
import type { Express } from './express.js';

export type { Response as HTTPResponse } from 'node-fetch';

export type NodeFetch = typeof NodeFetchFn;

export type { HTTPSServer, HTTPServer };
/**
 * @group Jimpex
 */
export type JimpexServer = Express | HTTPSServer;
/**
 * @group Jimpex
 */
export type JimpexServerInstance = HTTPServer | HTTPSServer;
/**
 * The paths to the SSL credentials. Depending on the application options, they can be
 * relative to the project root, or the application executable, but they can't be
 * absolute.
 *
 * @group Jimpex
 */
export type JimpexHTTPSCredentials = {
  /**
   * The path to the certificate authority file.
   */
  ca?: string;
  /**
   * The path to the certificate file.
   */
  cert?: string;
  /**
   * The path to the key file.
   */
  key?: string;
};
/**
 * The options to enable HTTP2.
 *
 * @group Jimpex
 */
export type JimpexHTTP2Options = {
  /**
   * Whether or not to enable HTTP2.
   */
  enabled?: boolean;
  /**
   * Custom options for the Spdy server.
   *
   * @see {@link https://github.com/spdy-http2/node-spdy#options}
   */
  spdy?: SpdyServerOptions['spdy'];
};
/**
 * The options to enable HTTPS.
 *
 * @group Jimpex
 */
export type JimpexHTTPSOptions = {
  /**
   * Whether or not to enable HTTPS.
   */
  enabled?: boolean;
  /**
   * The SSL credentials, and their location.
   */
  credentials?: JimpexHTTPSCredentials & {
    /**
     * If `true`, the credentials will be located relative to the project root, otherwise,
     * they will be located relative to the application executable.
     *
     * @default false
     */
    onHome?: boolean;
  };
};
