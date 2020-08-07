const ObjectUtils = require('wootils/shared/objectUtils');
const { removeSlashes, createRouteExpression } = require('../../utils/functions');
const { controllerCreator } = require('../../utils/wrappers');

/**
 * @typedef {Object} GatewayControllerRouteMethod
 * @description This object represets an HTTP method for a route the controller will mount.
 * @property {string}                               method   The name of the HTTP method.
 * @property {GatewayControllerEndpointInformation} endpoint The information for the endpoint
 *                                                           responsible from creating the route.
 * @ignore
 */

/**
 * @typedef {Object} GatewayControllerRoute
 * @description This object contains the information for an specific route the controller will
 *              mount.
 * @property {string}                              path    The path to the endpoint relative to
 *                                                         the entry point.
 * @property {string}                              route   The path the route will have. This is
 *                                                         different from `path` as it's possible
 *                                                         for the gateway to be implemented using
 *                                                         the `root` option.
 * @property {Array<GatewayControllerRouteMethod>} methods A list with all the methods the
 *                                                         controller will use to mount the route.
 * @ignore
 */

/**
 * @typedef {Object} GatewayConfigurationEndpoint
 * @description Normally, you would define an endpoint with just a string path, but you can use
 *              this type of object to add extra settings.
 * @property {string} path   The path to the endpoint relative to the entry point. It can include
 *                           placeholders for parameters like `/:parameter/`.
 * @property {string} method The HTTP method for the endpoint. This will tell the gateway the
 *                           type of route it should mount. If is not specified, it will use
 *                           `all`.
 */

/**
 * @typedef {Object} GatewayConfigurationEndpoints
 * @description A dictionary of endpoints or sub endpoints the gateway will use in order to mount
 *              routes.
 * @property {string|GatewayConfigurationEndpoints|GatewayConfigurationEndpoint} [endpointName]
 * It can be the path to an actual endpoint, a dictionary of sub endpoints, or a definition of
 * an endpoint with settings ({@link GatewayConfigurationEndpoint}).
 */

/**
 * @typedef {Object} GatewayConfiguration
 * @description This is a configuration object very similar to the one {@link APIClient} uses in
 *              order to configure the endpoints; the controller uses it to create the routes and
 *              to validate the HTTP methods.
 * @property {string}                        url     The entry point to the API the controller
 *                                                   will make the requests to.
 * @property {GatewayConfigurationEndpoints} gateway A dictionary with the endpoints the gateway
 *                                                   will make available.
 */

/**
 * @typedef {Object} GatewayControllerHeadersOptions
 * @description The options for how the gateway will handle the headers from the requests and the
 *              responses.
 * @property {boolean} [useXForwardedFor=true]
 * Whether or not to include the header with the request's IP address.
 * @property {boolean} [copyCustomHeaders=true]
 * Whether or not to copy all custom headers from the request. By custom header, it means all the
 * headers which names start with `x-`.
 * @property {Array} [copy=['authorization','content-type', 'referer', 'user-agent']]
 * A list of "known" headers the gateway will try to copy from the incoming request.
 * @property {Array} [remove=['server', 'x-powered-by']]
 * A list of "known" headers the gateway will try to remove the response.
 */

/**
 * @typedef {Object} GatewayControllerOptions
 * @description The options to configure how the gateway will manage the requests and the
 *              responses.
 * @property {string} [root='']
 * This is really a helper for when the gateway is used with an API client. The idea is that,
 * by default, the routes are mounted on the controller route, but with this option, you can
 * specify another sub path. For example: The controller is mounted on `/routes`, if you set
 * `root` to `gateway`, all the routes will be on `/routes/gateway`.
 * This become important (and useful) when you get the API client configuration (with
 * `endpointsForAPIClient`): The `url` will be the controller route, but all the endpoints will
 * be modified and prefixed with the `root`.
 * @property {string} [configurationSetting='api']
 * This is another option for when the gateway is used with an API client. When calling
 * `endpointsForAPIClient`, all the endpoints will be wrapped inside an object named after this
 * option. For example: `{ url: '...', endpoints: { api: { ... } } }`
 * @property {GatewayControllerHeadersOptions} [headers]
 * The options for how the gateway will handle the headers from the requests and the responses.
 */

/**
 * @typedef {Object} GatewayControllerCreatorOptions
 * @description This are the options sent to the controller creator that instantiates
 *              {@link GatewayController}. They're basically the same as
 *              {@link GatewayControllerOptions} but with a couple of extra ones.
 * @param {string} [serviceName='apiGeteway']             The name of the creator will use to
 *                                                        register the controller in the container.
 *                                                        No, this is not a typo. The creator will
 *                                                        register the controller so other
 *                                                        services can access the
 *                                                        `endpointsForAPIClient` getter. The
 *                                                        service will be available after the app
 *                                                        routes are mounted.
 *                                                        If this is overwritten, the creator will
 *                                                        ensure that the name ends with `Gateway`;
 *                                                        and if overwritten, but it doesn't
 *                                                        include `Gateway` at the end, and no
 *                                                        `configurationSetting` was defined, the
 *                                                        creator will use the custom name
 *                                                        (without `Gatway`) for
 *                                                        `configurationSetting`.
 * @param {string} [helperServiceName='apiGatewayHelper'] The name of the helper service the
 *                                                        creator will try to obtain from the
 *                                                        container. If `serviceName` is
 *                                                        overwritten, the default for this will
 *                                                        be `${serviceName}Helper`.
 * @param {string} [configurationSetting='api']           The name of the configuration setting
 *                                                        where the gateway configuration is
 *                                                        stored. If not overwritten, check the
 *                                                        description of `serviceName` to
 *                                                        understand which will be its default
 *                                                        value.
 * @param {Class}  [gatewayClass=GatewayController]       The class the creator will instantiate.
 *                                                        Similar to {@link APIClient}, this
 *                                                        allows for extra customization in cases
 *                                                        you may need multiple gateways.
 */

/**
 * @typedef {Object} GatewayControllerRequest
 * @description This is the information for a request the controller will make.
 * @property {string}           url     The URL for the request.
 * @property {HTTPFetchOptions} options The request options.
 */

/**
 * @typedef {Object} GatewayControllerEndpointInformation
 * @description This is the information for an specific endpoint that the gateway may use to
 *              send to a helper method in order to give it context.
 * @property {string}                              name     The name of the endpoint, which is
 *                                                          actually the path inside the gateway
 *                                                          configuration's `gateway` property.
 * @property {string|GatewayConfigurationEndpoint} settings The path for the endpoint, or the
 *                                                          dictionary of settings.
 */

/**
 * @typedef {function} GatewayHelperServiceRequestReducer
 * @description This is called in order to allow the helper to modify the information of a
 *              request that is about the fired.
 * @param {GatewayControllerRequest}             request  The information for a request the
 *                                                        controller will make.
 * @param {GatewayControllerEndpointInformation} endpoint The information for the endpoint
 *                                                        responsible of creating the route.
 * @param {ExpressRequest}                       req      The server's incoming request
 *                                                        information.
 * @param {ExpressResponse}                      res      The server's response information.
 * @param {ExpressNext}                          next     The function to call the next
 *                                                        middleware.
 * @return {GatewayControllerRequest}
 */

/**
 * @typedef {function} GatewayHelperServiceResponseReducer
 * @description This is called in order to allow the helper to modify the information of a
 *              response the gateway made.
 * @param {Object}                               response The response generated by the fetch
 *                                                        request.
 * @param {GatewayControllerEndpointInformation} endpoint The information for the endpoint
 *                                                        responsible of creating the route.
 * @param {ExpressRequest}                       req      The server's incoming request
 *                                                        information.
 * @param {ExpressResponse}                      res      The server's response information.
 * @param {ExpressNext}                          next     The function to call the next
 *                                                        middleware.
 * @return {Object}
 */

/**
 * @typedef {function} GatewayHelperServiceStreamVerification
 * @description This is called in order to allow the helper to decide whether a fetch request
 *              response should be added to the server's response stream. This will only be
 *              called if the helper also implements `handleEndpointResponse`.
 * @param {Object}                               response The response generated by the fetch
 *                                                        request.
 * @param {GatewayControllerEndpointInformation} endpoint The information for the endpoint
 *                                                        responsible of creating the route.
 * @param {ExpressRequest}                       req      The server's incoming request
 *                                                        information.
 * @param {ExpressResponse}                      res      The server's response information.
 * @param {ExpressNext}                          next     The function to call the next
 *                                                        middleware.
 * @return {boolean}
 */

/**
 * @typedef {function} GatewayHelperServiceResponseHandler
 * @description This is called in order for the helper to handle a response. This is only
 *              called if `shouldStreamEndpointResponse` returned `false`.
 * @param {Object}                               response The response generated by the fetch
 *                                                        request.
 * @param {GatewayControllerEndpointInformation} endpoint The information for the endpoint
 *                                                        responsible of creating the route.
 * @param {ExpressRequest}                       req      The server's incoming request
 *                                                        information.
 * @param {ExpressResponse}                      res      The server's response information.
 * @param {ExpressNext}                          next     The function to call the next
 *                                                        middleware.
 */

/**
 * @typedef {function} GatewayHelperServiceErrorHandler
 * @description This is called in order for the helper to handle a fetch request error.
 * @param {Error}                                error    The fetch request error.
 * @param {GatewayControllerEndpointInformation} endpoint The information for the endpoint
 *                                                        responsible of creating the route.
 * @param {ExpressRequest}                       req      The server's incoming request
 *                                                        information.
 * @param {ExpressResponse}                      res      The server's response information.
 * @param {ExpressNext}                          next     The function to call the next
 *                                                        middleware.
 */

/**
 * @typedef {Object} GatewayHelperService
 * @description A service that can have specific methods the gateway will call in order to
 *              modify requests, responses, handle errors, etc.
 * @property {?GatewayHelperServiceRequestReducer} reduceEndpointRequest
 * This is called in order to allow the helper to modify the information of a request that is
 * about the fired.
 * @property {?GatewayHelperServiceResponseReducer} reduceEndpointResponse
 * This is called in order to allow the helper to modify the information of a response the
 * gateway made.
 * @property {?GatewayHelperServiceStreamVerification} shouldStreamEndpointResponse
 * This is called in order to allow the helper to decide whether a fetch request response should
 * be added to the server's response stream. This will only be called if the helper also
 * implements `handleEndpointResponse`.
 * @property {?GatewayHelperServiceResponseHandler} handleEndpointResponse
 * This is called in order for the helper to handle a response. This is only called if
 * `shouldStreamEndpointResponse` returned `false`.
 * @property {?GatewayHelperServiceErrorHandler} handleEndpointError
 * This is called in order for the helper to handle a fetch request error.
 */

/**
 * Geneters routes that will act as a gateway to an specific set of endpoints.
 * @param {GatewayConfiguration}     gatewayConfig This is a configuration object very similar to
 *                                                 the one {@link APIClient} uses in order to
 *                                                 configure the endpoints; the controller uses it
 *                                                 to create the routes and to validate the HTTP
 *                                                 methods.
 * @param {string}                   route         The route where the controller will be mounted.
 * @param {HTTP}                     http          To make the fetch requests on the routes.
 * @param {GatewayControllerOptions} [options={}]  The options to configure how the gateway will
 *                                                 manage the requests and the responses.
 * @param {?GatewayHelperService}    [helper=null] A service that can have specific methods the
 *                                                 gateway will call in order to modify requests,
 *                                                 responses, handle errors, etc.
 */
class GatewayController {
  constructor(gatewayConfig, route, http, options = {}, helperService = null) {
    /**
     * The options to configure how the gateway will manage the requests and the responses.
     * @type {GatewayControllerOptions}
     * @access protected
     * @ignore
     */
    this._options = this._normalizeOptions(ObjectUtils.merge(
      {
        root: '',
        configurationSetting: 'api',
        headers: {
          useXForwardedFor: true,
          copyCustomHeaders: true,
          copy: options.headers && options.headers.copy ? options.headers.copy : [
            'authorization',
            'content-type',
            'referer',
            'user-agent',
          ],
          remove: options.headers && options.headers.remove ? options.headers.remove : [
            'server',
            'x-powered-by',
            'content-encoding',
          ],
        },
      },
      options,
    ));
    /**
     * The configuration for the API the controller will make requests to.
     * @type {GatewayConfiguration}
     * @access protected
     * @ignore
     */
    this._gatewayConfig = {
      ...gatewayConfig,
      url: removeSlashes(gatewayConfig.url, false, true),
    };
    /**
     * A local reference for the `http` service.
     * @type {HTTP}
     * @access protected
     * @ignore
     */
    this._http = http;
    /**
     * A list of the allowed HTTP methods an endpoint can have.
     * @type {Array}
     * @access protected
     * @ignore
     */
    this._allowedHTTPMethods = [
      'get',
      'head',
      'post',
      'put',
      'delete',
      'connect',
      'options',
      'trace',
    ];
    /**
     * A flat dictionary of the gateway endpoints. The key is the path on the original
     * dictionary (`this._gatewayConfig.gateway`) and the value is either the path (`string`)
     * or the endpoint settings ({@link GatewayConfigurationEndpoint}).
     * @type {Object}
     * @access protected
     * @ignore
     */
    this._endpoints = this._getNormalizedEndpoints();
    /**
     * The route where the controller is mounted.
     * @type {string}
     * @access protected
     * @ignore
     */
    this._route = removeSlashes(route);
    /**
     * A regular expression that will be used to remove the controller route from a request
     * path. This will allow the main middleware to extract the path to where the request should
     * be made.
     * @type {RegExp}
     * @access protected
     * @ignore
     */
    this._routeExpression = this._createRouteExpression();
    /**
     * This is the list of routes the controller will define.
     * @type {Array<GatewayControllerRoute>}
     * @access protected
     * @ignore
     */
    this._routes = this._createEndpointRoutes();
    /**
     * An {@link APIClient} configuration based on the controller routes.
     * @type {APIClientConfiguration}
     * @access protected
     * @Ignore
     */
    this._apiClientConfiguration = this._createAPIClientConfiguration();
    /**
     * A service that can have specific methods the gateway will call in order to modify
     * requests, responses, handle errors, etc.
     * @type {?GatewayHelperService}
     * @access protected
     */
    this._helperService = helperService;
    /**
     * A dictionary of boolean flags that specify if a helper service has method. This is to
     * avoid checking if the helper is defined and if "x method" is a function. If no helper
     * was specified, the object will have all the flags set to `false`.
     * @type {Object}
     * @access protected
     * @ignore
     */
    this._helperServiceInfo = this._createHelperServiceInfo();
  }
  /**
   * Defines all the routes on a given router.
   * @param {ExpressRouter} router           The router where all the routes will be added.
   * @param {Array}         [middlewares=[]] A list of custom middlewares that will be added before
   *                                         the one that makes the request.
   * @return {ExpressRouter}
   */
  addRoutes(router, middlewares = []) {
    this._routes.forEach((route) => route.methods.forEach((info) => this._addRoute(
      router,
      info.method,
      route.route,
      this._getMiddleware(info.endpoint),
      middlewares,
    )));

    return router;
  }
  /**
   * An {@link APIClient} configuration based on the controller routes.
     * @type {APIClientConfiguration}
   */
  get endpointsForAPIClient() {
    return this._apiClientConfiguration;
  }
  /**
   * The configuration for the API the controller will make requests to.
   * @type {GatewayConfiguration}
   */
  get gatewayConfig() {
    return this._gatewayConfig;
  }
  /**
   * The options to configure how the gateway will manage the requests and the responses.
   * @type {GatewayControllerOptions}
   */
  get options() {
    return this._options;
  }
  /**
   * Adds a route on a given router.
   * @param {ExpressRouter}     router              The router where the route will be added.
   * @param {string}            method              The HTTP method for the route.
   * @param {string}            route               The path for the route.
   * @param {ExpressMiddleware} endpointMiddleware  The middleware that makes the request.
   * @param {Array}             middlewares         Extra middlewares to add before the main one.
   *
   * @return {ExpressRouter}
   * @access protected
   * @ignore
   */
  _addRoute(router, method, route, endpointMiddleware, middlewares) {
    return router[method](route, [...middlewares, endpointMiddleware]);
  }
  /**
   * Based on the controller options and the gateway endpoints, this method will create an API
   * client configuration that can be used to make requests to this controller.
   * @return {APIClientConfiguration}
   * @access protected
   * @ignore
   */
  _createAPIClientConfiguration() {
    let endpoints;
    const { root } = this._options;
    if (root) {
      endpoints = Object.keys(this._endpoints).reduce(
        (acc, name) => {
          const endpoint = this._endpoints[name];
          let newEndpoint;
          if (typeof endpoint === 'string') {
            newEndpoint = removeSlashes(endpoint);
            newEndpoint = `${root}/${newEndpoint}`;
          } else {
            const endpointPath = removeSlashes(endpoint.path);
            newEndpoint = {
              ...endpoint,
              path: `${root}/${endpointPath}`,
            };
          }

          return {
            ...acc,
            [name]: newEndpoint,
          };
        },
        {},
      );
    } else {
      endpoints = this._endpoints;
    }
    return {
      url: `/${this._route}`,
      endpoints: {
        [this._options.configurationSetting]: ObjectUtils.unflat(endpoints),
      },
    };
  }
  /**
   * Based on the information from the endpoints, this method will create the routes the
   * controller will later add on a router.
   * @return {Array<GatewayControllerRoute>}
   * @throws {Error} If there's more than one endpoint using the same path with the same HTTP
   *                 method.
   * @access protected
   * @ignore
   */
  _createEndpointRoutes() {
    const routePrefixes = this._options.root ?
      `/${this._options.root}/` :
      '/';
    const routes = {};
    Object.keys(this._endpoints).forEach((name) => {
      const endpoint = this._endpoints[name];
      let endpointPath;
      let endpointMethod;
      if (typeof endpoint === 'string') {
        endpointPath = endpoint;
        endpointMethod = 'all';
      } else {
        endpointPath = endpoint.path;
        endpointMethod = endpoint.method ?
          this._normalizeHTTPMethod(endpoint.method) :
          'all';
      }

      endpointPath = removeSlashes(endpointPath);
      if (!routes[endpointPath]) {
        routes[endpointPath] = {
          path: endpointPath,
          methods: {},
        };
      }

      if (routes[endpointPath].methods[endpointMethod]) {
        const repeatedEndpoint = routes[endpointPath].methods[endpointMethod];
        throw new Error(
          'You can\'t have two gateway endpoints to the same path and with the same ' +
          `HTTP method: '${repeatedEndpoint}' and '${name}'`,
        );
      }

      routes[endpointPath].methods[endpointMethod] = name;
    });

    return Object.keys(routes)
    .map((endpointPath) => {
      const info = routes[endpointPath];
      return {
        path: info.path,
        route: `${routePrefixes}${info.path}`,
        methods: Object.keys(info.methods).map((methodName) => ({
          method: methodName,
          endpoint: {
            name: info.methods[methodName],
            settings: this._endpoints[info.methods[methodName]],
          },
        })),
      };
    });
  }
  /**
   * Validates if a server helper exists and creates a dictionary with flags for all the methods
   * a helper can have; this will allow other methods to check if the "helper method X" is
   * available without having to check if the helper is defined and if "method X" is a function.
   * @return {Object}
   * @access protected
   * @ignore
   */
  _createHelperServiceInfo() {
    const methods = [
      'reduceEndpointRequest',
      'reduceEndpointResponse',
      'shouldStreamEndpointResponse',
      'handleEndpointResponse',
      'handleEndpointError',
    ];
    let result;
    if (this._helperService) {
      result = methods.reduce(
        (methodsDict, name) => ({
          ...methodsDict,
          [name]: typeof this._helperService[name] === 'function',
        }),
        {},
      );
    } else {
      result = methods.reduce(
        (methodsDict, name) => ({ ...methodsDict, [name]: false }),
        {},
      );
    }

    return result;
  }
  /**
   * Creates a regular expression the main middleware will later use in order to remove the
   * controller route from the request url. That's needed in order to build the URL where the
   * request will be made.
   * @return {RegExp}
   * @access protected
   * @ignore
   */
  _createRouteExpression() {
    return createRouteExpression(
      this._options.root ? `${this._route}/${this._options.root}` : this._route,
      true,
      true,
    );
  }
  /**
   * Generates a middleware that will make a request and stream back the response.
   * @param {GatewayControllerEndpointInformation} endpoint The information for the enpdoint for
   *                                                        which the middleware is being created.
   * @return {ExpressMiddleware}
   * @access protected
   * @ignore
   */
  _getMiddleware(endpoint) {
    return (req, res, next) => {
      // Remove the controller route from the requested URL.
      const reqPath = req.originalUrl.replace(this._routeExpression, '');
      // Define the request options.
      const options = {
        method: req.method.toUpperCase(),
        headers: {},
      };
      // Copy the specified headers from the incoming request.
      this._options.headers.copy.forEach((name) => {
        if (req.headers[name]) {
          options.headers[name] = req.headers[name];
        }
      });
      // If enabled, copy the custom headers.
      if (this._options.headers.copyCustomHeaders) {
        options.headers = ObjectUtils.merge(
          options.headers,
          this._http.getCustomHeadersFromRequest(req),
        );
      }
      // If enabled, add the header with the request's IP.
      if (this._options.headers.useXForwardedFor) {
        options.headers['x-forwarded-for'] = this._http.getIPFromRequest(req);
      }
      /**
       * If the request has a body and the method is not `GET`, stringify it and addit to
       * the options.
       */
      if (options.method !== 'GET' && typeof req.body === 'object') {
        options.body = JSON.stringify(req.body);
        // If there's no `content-type`, let's assume it's JSON.
        if (!options.headers['content-type']) {
          options.headers['content-type'] = 'application/json';
        }
      }
      // Reduce the request information.
      const request = this._reduceEndpointRequest(
        {
          url: `${this._gatewayConfig.url}/${reqPath}`,
          options,
        },
        endpoint,
        req,
        res,
        next,
      );
      // Make the fetch request.
      return this._http.fetch(request.url, request.options)
      .then((response) => {
        // Reduce the response.
        const newResponse = this._reduceEndpointResponse(response, endpoint, req, res, next);
        // If the response should be sent down on the stream...
        if (this._shouldStreamEndpointResponse(newResponse, endpoint, req, res, next)) {
          // Update the server's response status.
          res.status(newResponse.status);
          // Copy the headers.
          newResponse.headers.forEach((value, name) => {
            if (!this._options.headers.remove.includes(name)) {
              res.setHeader(name, value);
            }
          });
          // Pipe the server's response into the fetch response stream.
          newResponse.body
          .pipe(res)
          .on('error', (error) => {
            next(error);
          });
        } else {
          // Otherwise, let the helper handle the response.
          this._handleEndpointResponse(newResponse, endpoint, req, res, next);
        }
      })
      .catch((error) => this._handleEndpointError(error, endpoint, req, res, next));
    };
  }
  /**
   * Flattens all the endpoints from gateway configuration into a one level dictionary, where the
   * key are the paths they used to have on the original configuration, and the values are the
   * endpoints definitions.
   * @return {Object}
   * @access protected
   * @ignore
   */
  _getNormalizedEndpoints() {
    return ObjectUtils.flat(
      this._gatewayConfig.gateway,
      '.',
      '',
      (ignore, value) => typeof value.path === 'undefined',
    );
  }
  /**
   * This method is called in order to handle a fetch request error. It will check if a
   * helper is defined and allow it to do it, or fallback and call the next middleware.
   * @param {Error}                                error    The fetch request error.
   * @param {GatewayControllerEndpointInformation} endpoint The information for the endpoint
   *                                                        responsible of creating the route.
   * @param {ExpressRequest}                       req      The server's incoming request
   *                                                        information.
   * @param {ExpressResponse}                      res      The server's response information.
   * @param {ExpressNext}                          next     The function to call the next
   *                                                        middleware.
   * @return {*}
   * @access protected
   * @ignore
   */
  _handleEndpointError(error, endpoint, req, res, next) {
    return this._helperServiceInfo.handleEndpointError ?
      this._helperService.handleEndpointError(error, endpoint, req, res, next) :
      next(error);
  }
  /**
   * This is called when the helper say that a fetch response shouldn't be sent, so the controller
   * will allow it to handle the response by itself.
   * @param {Object}                               response The response generated by the fetch
   *                                                        request.
   * @param {GatewayControllerEndpointInformation} endpoint The information for the endpoint
   *                                                        responsible of creating the route.
   * @param {ExpressRequest}                       req      The server's incoming request
   *                                                        information.
   * @param {ExpressResponse}                      res      The server's response information.
   * @param {ExpressNext}                          next     The function to call the next
   *                                                        middleware.
   * @return {*}
   * @access protected
   * @ignore
   */
  _handleEndpointResponse(response, endpoint, req, res, next) {
    return this._helperService.handleEndpointResponse(response, endpoint, req, res, next);
  }
  /**
   * This is a helper method used in order to validate if an HTTP method can be used in order to
   * define a route in the router. If the given method is not on the list of allowed methods,
   * it will be "normalized" to `all`. It also transforms the method into lower case.
   * @param {string} method The method to validate.
   * @return {string}
   * @access protected
   * @ignore
   */
  _normalizeHTTPMethod(method) {
    const newMethod = method.toLowerCase();
    return this._allowedHTTPMethods.includes(newMethod) ? newMethod : 'all';
  }
  /**
   * Normalizes the options recevied by the controller:
   * - Removes any trailing and leading slashes from the `root` path, if defined.
   * @param {GatewayControllerOptions} options The options to normalize.
   * @return {GatewayControllerOptions}
   * @access protected
   * @ignore
   */
  _normalizeOptions(options) {
    let newOptions;
    if (options.root) {
      const root = removeSlashes(options.root).trim();
      newOptions = { ...options, root };
    } else {
      newOptions = options;
    }

    return newOptions;
  }
  /**
   * This method is called in order to reduce a fetch request information. It will check if a
   * helper is defined and allow it to do it, or fallback and return the given information.
   * @param {GatewayControllerRequest}             request  The information for a request the
   *                                                        controller will make.
   * @param {GatewayControllerEndpointInformation} endpoint The information for the endpoint
   *                                                        responsible of creating the route.
   * @param {ExpressRequest}                       req      The server's incoming request
   *                                                        information.
   * @param {ExpressResponse}                      res      The server's response information.
   * @param {ExpressNext}                          next     The function to call the next
   *                                                        middleware.
   * @return {GatewayControllerRequest}
   * @access protected
   * @ignore
   */
  _reduceEndpointRequest(request, endpoint, req, res, next) {
    return this._helperServiceInfo.reduceEndpointRequest ?
      this._helperService.reduceEndpointRequest(request, endpoint, req, res, next) :
      request;
  }
  /**
   * This method is called in order to reduce a fetch response information. It will check if a
   * helper is defined and allow it to do it, or fallback and return the given information.
   * @param {Object}                               response The response generated by the fetch
   *                                                        request.
   * @param {GatewayControllerEndpointInformation} endpoint The information for the endpoint
   *                                                        responsible of creating the route.
   * @param {ExpressRequest}                       req      The server's incoming request
   *                                                        information.
   * @param {ExpressResponse}                      res      The server's response information.
   * @param {ExpressNext}                          next     The function to call the next
   *                                                        middleware.
   * @return {Object}
   * @access protected
   * @ignore
   */

  _reduceEndpointResponse(response, endpoint, req, res, next) {
    return this._helperServiceInfo.reduceEndpointResponse ?
      this._helperService.reduceEndpointResponse(response, endpoint, req, res, next) :
      response;
  }
  /**
   * This method is called in order to validate if the main middleware should pipe the fetch
   * response stream into the server's response or if the helper will handle the response.
   * This method will only call the helper if it implements both `shouldStreamEndpointResponse`
   * and `handleEndpointResponse`
   * @param {Object}                               response The response generated by the fetch
   *                                                        request.
   * @param {GatewayControllerEndpointInformation} endpoint The information for the endpoint
   *                                                        responsible of creating the route.
   * @param {ExpressRequest}                       req      The server's incoming request
   *                                                        information.
   * @param {ExpressResponse}                      res      The server's response information.
   * @param {ExpressNext}                          next     The function to call the next
   *                                                        middleware.
   * @return {boolean}
   * @access protected
   * @ignore
   */
  _shouldStreamEndpointResponse(response, endpoint, req, res, next) {
    return (
      this._helperServiceInfo.shouldStreamEndpointResponse &&
      this._helperServiceInfo.handleEndpointResponse
    ) ?
      this._helperService.shouldStreamEndpointResponse(response, endpoint, req, res, next) :
      true;
  }
}
/**
 * This controller allows you to have gateway routes that actually make requests and respond with
 * the contents from an specified API.
 * @type {ControllerCreator}
 * @param {GatewayControllerCreatorOptions} [options]     The options to customize the controller.
 * @param {Function():Array}                [middlewares] This function can be used to add custom
 *                                                        middlewares on the gateway routes. If
 *                                                        implemented, it must return a list of
 *                                                        middlewares when executed.
 */
const gatewayController = controllerCreator((
  options = {},
  middlewares = null,
) => (app, route) => {
  /**
   * Formats the name in order to keep consistency with the helper service and the configuration
   * setting: If the `serviceName` is different from the default, make sure it ends with
   * `Gateway`, set the default helper service name to `${serviceName}Helper` and the default
   * configuration setting to the same as the service name (without the `Gateway`).
   * This way, if you just use `myApi`, the service name will be `myApiGateway`, the helper name
   * will be `myApiGatewayHelper` and the configuration setting `myApi`.
   */
  const defaultServiceName = 'apiGateway';
  let defaultHelperServiceName = 'apiGatewayHelper';
  let defaultConfigurationSetting = 'api';
  let { serviceName = defaultServiceName } = options;
  if (serviceName !== defaultServiceName) {
    defaultConfigurationSetting = serviceName;
    if (!serviceName.match(/gateway$/i)) {
      serviceName = `${serviceName}Gateway`;
    }
    defaultHelperServiceName = `${serviceName}Helper`;
  }
  /**
   * Get the settings the controller needs in order to use with the container before creating
   * the instance.
   */
  const {
    helperServiceName = defaultHelperServiceName,
    configurationSetting = defaultConfigurationSetting,
    GatewayClass = GatewayController,
  } = options;
  /**
   * Update the options with the resolved configuration setting name, because the class will
   * needed when generating API Client endpoints.
   */
  const newOptions = {
    ...options,
    configurationSetting,
  };
  // Get the gateway configuration.
  const gatewayConfig = app.get('appConfiguration').get(configurationSetting);
  // Generate the controller
  const ctrl = new GatewayClass(
    gatewayConfig,
    route,
    app.get('http'),
    newOptions,
    helperServiceName ? app.try(helperServiceName) : null,
  );
  /**
   * Register a service for the controller so other services can ask for the endpoints formatted
   * for an API Client.
   */
  app.set(serviceName, () => ctrl);
  /**
   * Check if there are actual middlewares to be included, and in case there are Jimpex
   * middlewares, connect them
   */
  let useMiddlewares;
  if (middlewares) {
    useMiddlewares = middlewares(app).map((middleware) => (
      middleware.connect ?
        middleware.connect(app) :
        middleware
    ));
  }
  // Add the routes to the router and return it.
  return ctrl.addRoutes(app.get('router'), useMiddlewares);
});

module.exports = {
  GatewayController,
  gatewayController,
};
