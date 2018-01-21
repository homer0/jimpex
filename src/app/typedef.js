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
 * @property {Boolean} [hasFolder=true]                    Whether the configurations are inside a
 *                                                         sub directory or not. If `true`, a
 *                                                         configuration path would be
 *                                                         `config/[app-name]/[file]`.
 * @property {string}  [environmentVariable='CONFIG']      The name of the environment variable
 *                                                         that will be used to set the active
 *                                                         configuration.
 * @property {Boolean} [loadFromEnvironment=true]          Whether or not to check for the
 *                                                         environment variable and load a
 *                                                         configuration based on its value.
 * @property {Boolean} [loadVersionFromConfiguration=true] If `true`, the app `version` will be
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
 * @property {Boolean} [enabled=true]    Whether or not to include the middleware for static files.
 * @property {Boolean} [onHome=true]     If `true`, the path to the statics folder will be relative
 *                                       to the project root directory, otherwise, it will be
 *                                       relative to the directory where the app executable file is
 *                                       located.
 * @property {string}  [folder='static'] The name of the folder for static files.
 */

/**
 * @typedef {Object} JimpexExpressOptions
 * @property {Boolean} [trustProxy=true]        Whether or not to enable the `trust proxy` option.
 * @property {Boolean} [disableXPoweredBy=true] Whether or not to remove the `x-powered-by` header.
 * @property {Boolean} [compression=true]       Whether or not to add the `compression` middleware.
 * @property {Boolean} [bodyParser=true]        Whether or not to add the `body-parser` middleware.
 * @property {Boolean} [multer=true]            Whether or not to add the `multer` middleware.
 */

/**
 * @typedef {Object} JimpexDefaultServicesOptions
 * @property {Boolean} [common=true] Whether or not to register all the `common` service providers.
 * @property {Boolean} [http=true]   Whether or not to register all the `http` service providers.
 * @property {Boolean} [api=true]    Whether or not to register all the `api` service providers.
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
