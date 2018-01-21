const extend = require('extend');
const { deferred } = require('wootils/shared');
const { provider } = require('../../utils/wrappers');
/**
 * @typedef {Object} HTMLGeneratorOptions The options to customize the an `HTMLGenerator` service.
 * @property {string}  [template='index.tpl.html']                 The name of the file it should
 *                                                                 use as template.
 * @property {string}  [file='index.html']                         The name of the generated file.
 * @property {Boolean} [deleteTemplateAfter=true]                  Whether or not to delete the
 *                                                                 tempalte after generating the
 *                                                                 file.
 * @property {string}  [replacePlaceholder='{{appConfiguration}}'] The placeholder string where the
 *                                                                 information will be written.
 * @property {string}  [variable='appConfiguration']               The name of the variable that
 *                                                                 will have the information on
 *                                                                 the file.
 * @property {Array} [configurationKeys=['features', 'version', 'postMessagesPrefix']] A list of
 * settings from the app configuration that will be used as the information to inject on
 * the file.
 */

/**
 * @typedef {Object} HTMLGeneratorValuesService A service to provide the information value to an
 *                                              `HTMLGenerator` service to use on the generated
 *                                              file.
 * @property {function():Promise<Object,Error>} getValues This is the method an `HTMLGenerator`
 *                                                        service will call in order to retrieve
 *                                                        the values that should be injected on
 *                                                        the generated file.
 */

/**
 * This is a utility sever that generates an HTML file with custom information when the app server
 * is started.
 */
class HTMLGenerator {
  /**
   * Class constructor.
   * @param {HTMLGeneratorOptions}        [options]            To customize the service.
   * @param {AppConfiguration}            appConfiguration     To read the values of the settings
   *                                                           that are going to be send to the
   *                                                           file.
   * @param {Logger}                      appLogger            To log messages when the file is
   *                                                           generated, when the template is
   *                                                           removed, and if it happens, when
   *                                                           an error is thrown.
   * @param {FrontendFs}                  frontendFs           To read the contents of the template.
   * @param {?HTMLGeneratorValuesService} [valuesService=null] If specified, instead of getting
   *                                                           the values from the app
   *                                                           configuration, they'll be retrieved
   *                                                           from this service `getValues` method.
   * @throws {Error} if `valuesService` is specified but it doesn't have a `getValues` method.
   * @todo Move `options` to the before last parameter as it's optional
   */
  constructor(
    options,
    appConfiguration,
    appLogger,
    frontendFs,
    valuesService = null
  ) {
    /**
     * The service options.
     * @type {HTMLGeneratorOptions}
     */
    this.options = extend({
      template: 'index.tpl.html',
      file: 'index.html',
      deleteTemplateAfter: true,
      replacePlaceholder: '{{appConfiguration}}',
      variable: 'appConfiguration',
      configurationKeys: ['features', 'version', 'postMessagesPrefix'],
    }, options);
    /**
     * This check is to completely overwrite the `configurationKeys` if they were specified on
     * the received `options` parameters. The reason it's being made after the `extend` it's because
     * `extend` mergers the array, so if you have `['a', 'b', 'c']` and merge it with `['d', 'e']`
     * you end up with `['d', 'e', 'c']`, and in this case, that's not very useful.
     */
    if (options.configurationKeys) {
      this.options.configurationKeys = options.configurationKeys.slice();
    }
    // If `valuesService` was specified, check if it has a `getValues` method.
    if (valuesService && typeof valuesService.getValues !== 'function') {
      throw new Error('The HTMLGenerator values service must have a `getValues` method');
    }
    /**
     * A local reference for the `appConfiguration` service.
     * @type {AppConfiguration}
     */
    this.appConfiguration = appConfiguration;
    /**
     * A local reference for the `appLogger` service.
     * @type {Logger}
     */
    this.appLogger = appLogger;
    /**
     * A local reference for the `frontendFs` service.
     * @type {FrontendFs}
     */
    this.frontendFs = frontendFs;
    /**
     * A local reference for the recieved `valuesService` service.
     * @type {?HTMLGeneratorValuesService}
     */
    this.valuesService = valuesService;
    /**
     * Whether or not the file has been generated.
     * @type {Boolean}
     * @ignore
     * @access protected
     */
    this._fileReady = false;
    /**
     * A deferred promise to return when another service asks if the file has been generated. Once
     * this sevice finishes generating the file, the promise will be resolved.
     * @type {Object}
     * @ignore
     * @access protected
     */
    this._fileDeferred = deferred();
  }
  /**
   * Returns a promise that will be resolved when the file has been generated.
   * @return {Promise<undefined,undefined>}
   */
  whenReady() {
    return this._fileReady ?
      Promise.resolve() :
      this._fileDeferred.promise;
  }
  /**
   * Get the name of the file the service generates.
   * @return {string}
   */
  getFile() {
    return this.options.file;
  }
  /**
   * Get the values that are going to be injected on the file.
   * @return {Promise<Object,?Error>}
   */
  getValues() {
    let valuesPromise;
    // If an `HTMLGeneratorValuesService` was specified...
    if (this.valuesService) {
      // ...get the values from there.
      valuesPromise = this.valuesService.getValues();
    } else if (this.options.configurationKeys.length) {
      /**
       * ...if there are configuration keys to be copied, set to return an already resolved
       * promise with the settings from the configuration.
       */
      valuesPromise = Promise.resolve(
        this.appConfiguration.get(this.options.configurationKeys)
      );
    } else {
      // ...otherwsie, return an already resolved promise with an empty object.
      valuesPromise = Promise.resolve({});
    }

    return valuesPromise;
  }
  /**
   * Generate the HTML file.
   * @return {Promise<undefined,Error>}
   */
  generateHTML() {
    // Get the service options.
    const {
      template,
      deleteTemplateAfter,
      replacePlaceholder,
      variable,
      file,
    } = this.options;
    // Define the variable where the template contents will be saved.
    let templateContents = '';
    // Read the template file.
    return this.frontendFs.read(`./${template}`)
    .then((contents) => {
      // Save the template contents.
      templateContents = contents;
      // Get the values to inject.
      return this.getValues();
    })
    .then((values) => {
      /**
       * Encode them on a JSON string so when executed on the browser they'll be interpreted as
       * an Object.
       */
      const htmlObject = JSON.stringify(values);
      // Replace the placeholder with the definition of the variable.
      const html = templateContents
      .replace(
        replacePlaceholder,
        `window.${variable} = ${htmlObject}`
      );
      // Write the generated file.
      return this.frontendFs.write(file, html);
    })
    .then(() => {
      this.appLogger.success(`The HTML was successfully generated (${file})`);
      /**
       * If the template needs to be deleted, return the call to the `delete` method, otherwise,
       * just an empty object to continue the promise chain.
       * @todo Change it to a short circuit evaluation.
       */
      return deleteTemplateAfter ? this.frontendFs.delete(`./${template}`) : {};
    })
    .then(() => {
      // If the template was deleted, log a message informing it.
      if (deleteTemplateAfter) {
        this.appLogger.info(`The HTML template was successfully removed (${template})`);
      }
      /**
       * Mark the `_fileReady` flag as `true` so the next calls to `whenReady` won't get the
       * deferred promise.
       */
      this._fileReady = true;
      // Resolve the deferred promise.
      this._fileDeferred.resolve();
    })
    .catch((error) => {
      this.appLogger.error('There was an error while generating the HTML');
      return Promise.reject(error);
    });
  }
}
/**
 * Generates an `HTMLGenerator` service provider with customized options and that automatically
 * hooks itself to the `after-start` event of the app server in order to trigger the generation of
 * the html file when the server starts.
 * @param {string}                [serviceName='htmlGenerator'] The name of the service that will
 *                                                              be register into the app.
 * @param {HTMLGeneratorOptions}  [options={}]                  Options to customize the service.
 * @param {?string}               [valuesServiceName=null]      The name of a service used to read
 *                                                              the values that will be injected in
 *                                                              the generated file.
 * @return {Provider}
 */
const htmlGeneratorCustom = (
  serviceName = 'htmlGenerator',
  options = {},
  valuesServiceName = null
) => provider((app) => {
  app.set(serviceName, () => {
    let valuesService = null;
    if (valuesServiceName) {
      valuesService = app.get(valuesServiceName);
    }

    return new HTMLGenerator(
      options,
      app.get('appConfiguration'),
      app.get('appLogger'),
      app.get('frontendFs'),
      valuesService
    );
  });

  app.get('events')
  .once('after-start', () => app.get(serviceName).generateHTML());
});
/**
 * The service provider that once registered on the app container will set an instance of
 * `HTMLGenerator` as the `htmlGenerator` service. It also hooks itself to the `after-start`
 * event of the app server in order to trigger the generation of
 * the html file when the server starts.
 * @example
 * // Register it on the container
 * container.register(htmlGenerator);
 * // Getting access to the service instance
 * const htmlGenerator = container.get('htmlGenerator');
 * @type {Provider}
 */
const htmlGenerator = htmlGeneratorCustom();

module.exports = {
  HTMLGenerator,
  htmlGenerator,
  htmlGeneratorCustom,
};
