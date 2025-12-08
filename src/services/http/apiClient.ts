import {
  APIClient as APIClientBase,
  type ErrorResponse,
  type APIClientOptions,
  type FetchClient,
} from '@homer0/api-utils';
import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { providerCreator } from '../../utils/index.js';
import type { HTTP } from './http.js';
import type { HTTPErrorClass } from '../common/index.js';

export type { ErrorResponse };
/**
 * The required settings needed to create the an API client.
 *
 * @group Services/APIClient
 */
export type APIClientConfig = Pick<APIClientOptions, 'url' | 'endpoints'>;
/**
 * A dictionary of endpoints for the API client.
 * This is declared as standalone because it needs to reference them multiple times.
 *
 * @group Services/APIClient
 */
export type EndpointsType = APIClientOptions['endpoints'];
/**
 * The format the settings needs to have in the application configuration in order to
 * create a valid API client.
 * The settings may include the endpoints dictionary in the `endpoints` property, or the
 * gateway `property`, with `endpoints` always having priority if both exists.
 * The reason for the `gateway` property to be valid, is in case the application also
 * implements a {@link GatewayController}, using the same property for both things will
 * help reduce the amount of duplicated definitions.
 *
 * @group Services/APIClient
 */
export type APIClientSettings = Omit<APIClientConfig, 'endpoints'> &
  (
    | {
        endpoints: EndpointsType;
        gateway?: EndpointsType;
      }
    | {
        endpoints?: EndpointsType;
        gateway: EndpointsType;
      }
  );
/**
 * The options to construct a {@link APIClient}.
 *
 * @group Services/APIClient
 */
export type APIClientConstructorOptions = APIClientSettings & {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    http: HTTP;
    HTTPError: HTTPErrorClass;
  };
};
/**
 * An API client for the application to use. What makes this service special is that it
 * formats received errors using the {@link _HTTPError} class, and as fetch client, it
 * uses the {@link HTTP} service, allowing the application to to internally handle all the
 * requests and responses.
 *
 * The only reason to use the class directly is if you want to subclass it, as you would
 * normally just register the {@link apiClientProvider}.
 *
 * @group Services
 * @group Services/APIClient
 */
export class APIClient extends APIClientBase {
  /**
   * The service that makes the requests to the API.
   */
  protected readonly _http: HTTP;
  /**
   * The class to generate possible errors in the requests.
   */
  protected readonly _HTTPError: HTTPErrorClass;
  /**
   * The configuration of the API it uses.
   */
  protected readonly _apiConfig: APIClientConfig;
  /**
   * @param options  The options to construct the class.
   */
  constructor({ inject: { http, HTTPError }, ...rest }: APIClientConstructorOptions) {
    const { endpoints, gateway, url } = rest;
    const useEndpoints = (endpoints || gateway)!;
    const apiConfig = {
      url,
      endpoints: useEndpoints,
    };
    super({
      ...apiConfig,
      fetchClient: http.fetch as unknown as FetchClient,
    });

    this._http = http;
    this._HTTPError = HTTPError;
    this._apiConfig = deepAssignWithOverwrite({}, apiConfig);
  }
  /**
   * The configuration for the API.
   */
  get apiConfig(): Readonly<APIClientConfig> {
    return deepAssignWithOverwrite({}, this._apiConfig);
  }
  /**
   * Tries to obtain a message from an error caused on a failed request.
   *
   * @param response  The response from the failed request.
   */
  protected _getErrorMessageFromResponse(response: unknown) {
    const res = response as {
      error?: string;
      data?: {
        message?: string;
        error?: string;
      };
    };
    if (res.error) return res.error;
    if (res.data) {
      if (res.data.message) return res.data.message;
      if (res.data.error) return res.data.error;
    }

    return 'Unexpected error';
  }
  /**
   * Generates an {@link _HTTPError} from the response of a failed request.
   *
   * @param response  The response from the failed request.
   * @param status    The status code of the response.
   */
  protected override formatError<ResponseType extends ErrorResponse>(
    response: ResponseType,
    status: number,
  ): Error {
    return new this._HTTPError(this._getErrorMessageFromResponse(response), status);
  }
}
/**
 * The options for the provider creator that registers an {@link APIClient} in the
 * container.
 * These options allow the application to register multiple instances for different APIs.
 *
 * @group Services/APIClient
 */
export type APIClientProviderOptions = {
  /**
   * The name of the service that will be registered into the app.
   *
   * @default 'apiClient'
   */
  serviceName?: string;
  /**
   * The name of the configuration setting that has the API information.
   *
   * @default 'api'
   */
  configSetting?: string;
  /**
   * The class the service will instantiate. It has to extend {@link APIClient}.
   *
   * @default APIClient
   */
  clientClass?: typeof APIClient;
};
/**
 * The provider creator to register an instance of {@link APIClient} on the container.
 *
 * @example
 *
 * <caption>Basic usage</caption>
 *
 *   // Register it on the container
 *   container.register(apiClientProvider);
 *   // Getting access to the service instance
 *   const apiClient = container.get<APIClient>('apiClient');
 *
 * @example
 *
 * <caption>With custom options</caption>
 *
 *   container.register(
 *     apiClientProvider({
 *       serviceName: 'myApiClient',
 *       configSetting: 'myApi',
 *     }),
 *   );
 *
 * @group Providers
 * @group Services/APIClient
 */
export const apiClientProvider = providerCreator(
  (options: APIClientProviderOptions = {}) =>
    (app) => {
      const defaultName = 'apiClient';
      const { serviceName = defaultName, clientClass: ClientClass = APIClient } = options;
      let { configSetting } = options;
      if (!configSetting) {
        configSetting = serviceName === defaultName ? 'api' : serviceName;
      }

      app.set(
        serviceName,
        () =>
          new ClientClass({
            inject: {
              http: app.get('http'),
              HTTPError: app.get('HTTPError'),
            },
            ...app.getConfig<APIClientSettings>(configSetting!),
          }),
      );
    },
);
