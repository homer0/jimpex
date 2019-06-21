/**
 * @external {Jimple} https://yarnpkg.com/en/package/jimple
 */

/**
 * @typedef {Object} JimpexConfigurationOptions
 * @property {Object}  [default=null]                      The app default configuration.
 * @property {string}  [name='app']                        The name of the app, used for the
 *                                                         configuration files.
 * @property {string}  [path='config/']                    The path to the configuration files
 *                                                         directory, relative to the project root
 *                                                         directory.
 * @property {boolean} [hasFolder=true]                    Whether the configurations are inside a
 *                                                         sub directory or not. If `true`, a
 *                                                         configuration path would be
 *                                                         `config/[app-name]/[file]`.
 * @property {string}  [environmentVariable='CONFIG']      The name of the environment variable
 *                                                         that will be used to set the active
 *                                                         configuration.
 * @property {boolean} [loadFromEnvironment=true]          Whether or not to check for the
 *                                                         environment variable and load a
 *                                                         configuration based on its value.
 * @property {boolean} [loadVersionFromConfiguration=true] If `true`, the app `version` will be
 *                                                         taken from the loaded configuration,
 *                                                         otherwise, when a configuration is
 *                                                         loaded, the app will copy the version it
 *                                                         has into the configuration.
 * @property {string} [filenameFormat='[app-name].[configuration-name].config.js'] The name format
 *                                                                                 the configuration
 *                                                                                 files have.
 */

/**
 * @typedef {Object} JimpexStaticsOptions
 * @property {boolean} [enabled=true]    Whether or not to include the middleware for static files.
 * @property {boolean} [onHome=false]    If `true`, the path to the statics folder will be relative
 *                                       to the project root directory, otherwise, it will be
 *                                       relative to the directory where the app executable file is
 *                                       located.
 * @property {string}  [route='static']  The name of both the route and the folder, relative to
 *                                       whatever you defined with the `onHome` option.
 * @property {string}  [folder='']       By default, the folder will be the same as the `route`,
 *                                       but you can use this option to define a relative path that
 *                                       won't affect the route.
 */

/**
 * @typedef {Object} JimpexExpressOptions
 * @property {boolean} [trustProxy=true]        Whether or not to enable the `trust proxy` option.
 * @property {boolean} [disableXPoweredBy=true] Whether or not to remove the `x-powered-by` header.
 * @property {boolean} [compression=true]       Whether or not to add the `compression` middleware.
 * @property {boolean} [bodyParser=true]        Whether or not to add the `body-parser` middleware.
 * @property {boolean} [multer=true]            Whether or not to add the `multer` middleware.
 */

/**
 * @typedef {Object} JimpexDefaultServicesOptions
 * @property {boolean} [common=true] Whether or not to register all the `common` service providers.
 * @property {boolean} [http=true]   Whether or not to register all the `http` service providers.
 * @property {boolean} [utils=true]  Whether or not to register all the `utils` service providers.
 */

/**
 * @typedef {Object} JimpexOptions
 * @property {string}                       [version='0.0.0']      The app version. To be used on
 *                                                                 the configuration.
 * @property {JimpexConfigurationOptions}   [configuration]        The options for the app
 *                                                                 configuration service.
 * @property {JimpexStaticsOptions}         [statics]              The options for the app static
 *                                                                 `middleware`.
 * @property {string}                       [filesizeLimit='15MB'] The size limit for the requests
 *                                                                 payload.
 * @property {JimpexExpressOptions}         [express]              The options for the Express app.
 * @property {JimpexDefaultServicesOptions} [defaultServices]      To tell the app which services
 *                                                                 should be registered when
 *                                                                 instantiated.
 */
