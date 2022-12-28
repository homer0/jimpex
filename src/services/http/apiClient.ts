import {
  APIClient as APIClientBase,
  type ErrorResponse,
  type APIClientOptions,
  type FetchClient,
} from '@homer0/api-utils';
import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { providerCreator } from '../../utils';
import type { SimpleConfig } from '../../types';
import type { HTTP } from './http';
import type { HTTPErrorClass } from '../common';

export type { ErrorResponse };
export type APIClientConfig = Pick<APIClientOptions, 'url' | 'endpoints'>;
type EndpointsType = APIClientOptions['endpoints'];
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
export type APIClientConstructorOptions = APIClientSettings & {
  inject: {
    http: HTTP;
    HTTPError: HTTPErrorClass;
  };
};
type CommonError = {
  error?: string;
  data?: {
    message?: string;
    error?: string;
  };
};

export class APIClient extends APIClientBase {
  protected readonly http: HTTP;
  protected readonly HTTPError: HTTPErrorClass;
  protected readonly apiConfig: APIClientConfig;
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

    this.http = http;
    this.HTTPError = HTTPError;
    this.apiConfig = deepAssignWithOverwrite({}, apiConfig);
  }

  getConfig(): Readonly<APIClientConfig> {
    return deepAssignWithOverwrite({}, this.apiConfig);
  }

  protected getErrorMessageFromResponse(response: unknown) {
    const res = response as CommonError;
    if (res.error) return res.error;
    if (res.data) {
      if (res.data.message) return res.data.message;
      if (res.data.error) return res.data.error;
    }

    return 'Unexpected error';
  }

  protected override formatError<ResponseType extends ErrorResponse>(
    response: ResponseType,
    status: number,
  ): Error {
    return new this.HTTPError(this.getErrorMessageFromResponse(response), status);
  }
}

export type APIClientProviderOptions = {
  serviceName?: string;
  configurationSetting?: string;
  clientClass?: typeof APIClient;
};

export const apiClientProvider = providerCreator(
  (options: APIClientProviderOptions = {}) =>
    (app) => {
      const defaultName = 'apiClient';
      const { serviceName = defaultName, clientClass: ClientClass = APIClient } = options;
      let { configurationSetting } = options;
      if (!configurationSetting) {
        configurationSetting = serviceName === defaultName ? 'api' : serviceName;
      }

      app.set(
        serviceName,
        () =>
          new ClientClass({
            inject: {
              http: app.get('http'),
              HTTPError: app.get('HTTPError'),
            },
            ...app
              .get<SimpleConfig>('config')
              .get<APIClientSettings>(configurationSetting!),
          }),
      );
    },
);
