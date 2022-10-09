import { get } from '@homer0/object-utils';
import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { deferred, type DeferredPromise } from '@homer0/deferred';
import { providerCreator } from '../../utils';
import type { Config, Logger } from '../../types';
import type { FrontendFs } from '../frontend';
/**
 * The options to customize a {@link HTMLGenerator} instance.
 *
 * @group Services/HTMLGenerator
 */
export type HTMLGeneratorOptions = {
  /**
   * The name of the file it should use as template.
   *
   * @default 'index.tpl.html'
   */
  template: string;
  /**
   * The name of the generated file.
   *
   * @default 'index.html'
   */
  file: string;
  /**
   * If `true`, it won't log messages on the terminal when generating the file.
   *
   * @default false
   */
  silent: boolean;
  /**
   * Whether or not to delete the tempalte after generating the file.
   *
   * @default true
   */
  deleteTemplateAfter: boolean;
  /**
   * The placeholder string where the information will be written.
   *
   * @default /\{\{appConfi(?:guration)?\}\}/
   */
  replacePlaceholder: string | RegExp;
  /**
   * A regular expression for dynamic placeholders that will be replaced by values when
   * the file is generated.
   *
   * @default /\{\{(.*?)\}\}/gi
   */
  placeholderExpression: RegExp;
  /**
   * The name of the variable that will have the information on the file.
   *
   * @default 'appConfig'
   */
  variableName: string;
  /**
   * A list of settings from the app configuration that will be used as the information to
   * inject on the file.
   *
   * @default ['features', 'version', 'postMessagesPrefix']
   */
  configKeys: string[];
};
/**
 * An external service that can be used to provide the values the generator will replace
 * in the template.
 *
 * @group Services/HTMLGenerator
 */
export type HTMLGeneratorValuesService = {
  /**
   * A function that will be called to get the values to replace in the template.
   *
   * @param options  The service customization options.
   */
  getValues: (options: HTMLGeneratorOptions) => Promise<Record<string, unknown>>;
};
/**
 * The options to construct a {@link HTMLGenerator}.
 *
 * @group Services/HTMLGenerator
 */
export type HTMLGeneratorConstructorOptions = Partial<HTMLGeneratorOptions> & {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    config: Config;
    logger: Logger;
    frontendFs: FrontendFs;
    /**
     * A service that can provide the values to replace in the template. If specified, the
     * values from `configKeys` will be ignored.
     */
    valuesService?: HTMLGeneratorValuesService;
  };
};
/**
 * Custom options for the provider that will register an instance of {@link HTMLGenerator}
 * as a service.
 *
 * @group Services/HTMLGenerator
 */
export type HTMLGeneratorProviderOptions = Partial<HTMLGeneratorOptions> & {
  /**
   * The name that will be used to register the service on the container. This is to allow
   * multiple "instances" of the service to be created.
   *
   * @default 'htmlGenerator'
   */
  serviceName?: string;
  /**
   * The name of a service that the generator will use in order to read the values that
   * will be replaced on the template. If the service is available, the values from
   * `configKeys` will be ignored.
   *
   * @default 'htmlGeneratorValues'
   */
  valuesServiceName?: string;
};
/**
 * This is a utility service that generates an HTML file with custom information when the
 * application is started.
 *
 * @group Services
 * @group Services/HTMLGenerator
 */
export class HTMLGenerator {
  /**
   * The service customization options.
   */
  protected readonly _options: HTMLGeneratorOptions;
  /**
   * The application configuration service, to get the settings specified by the
   * `configKeys` option.
   */
  protected readonly _config: Config;
  /**
   * The service that logs messages on the terminal, in case the `silent` option is `false`.
   */
  protected readonly _logger: Logger;
  /**
   * The service that interacts with the filesystem.
   */
  protected readonly _frontendFs: FrontendFs;
  /**
   * A service that can provide values to be replaced in the template.
   */
  protected readonly _valuesService?: HTMLGeneratorValuesService;
  /**
   * Whether or not the file was already generated.
   */
  protected _fileReady: boolean = false;
  /**
   * A deferred promise to return when another service asks if the file has been
   * generated. Once this sevice finishes generating the file, the promise will be
   * resolved for all implementations that hold a reference to this deferred.
   */
  protected _fileDeferred?: DeferredPromise<void>;
  /**
   * @param options  The options to construct the class.
   * @throws If `valuesService` is specified but it doesn't have a `getValues`
   *         method.
   */
  constructor({
    inject: { config, logger, frontendFs, valuesService },
    ...options
  }: HTMLGeneratorConstructorOptions) {
    this._config = config;
    this._logger = logger;
    this._frontendFs = frontendFs;
    this._valuesService = valuesService;
    this._options = deepAssignWithOverwrite(
      {
        template: 'index.tpl.html',
        file: 'index.html',
        silent: false,
        deleteTemplateAfter: true,
        replacePlaceholder: /\{\{appConfig(?:uration)?\}\}/,
        placeholderExpression: /\{\{(.*?)\}\}/gi,
        variableName: 'appConfig',
        configKeys: ['features', 'version', 'postMessagesPrefix'],
      },
      options,
    );

    if (this._valuesService && typeof this._valuesService.getValues !== 'function') {
      throw new Error('The HTMLGenerator values service must have a `getValues` method');
    }
  }
  /**
   * Gets a promise that will be resolved when the file has been generated.
   */
  whenReady(): Promise<void> {
    return this._fileDeferred ? this._fileDeferred.promise : Promise.resolve();
  }
  /**
   * Generates the HTML file.
   */
  async generateHTML(): Promise<void> {
    // The file is already generated, and since this is async, return the promise.
    if (this._fileReady) return undefined;
    // If the file is not ready, but the deferred exists, return the reference to the promise.
    if (this._fileDeferred) return this._fileDeferred.promise;
    // Create the deferred promise.
    this._fileDeferred = deferred<void>();
    const { template, deleteTemplateAfter, file, silent } = this._options;
    try {
      // Get the template.
      const templateContents = await this._frontendFs.read(template);
      // Get the values to replace.
      const values = await this._getValues();
      // Replace/process the template.
      const html = this._processHTML(templateContents, values);
      // Write it in the filesystem.
      await this._frontendFs.write(file, html);
      if (!silent) {
        this._logger.success(`The HTML file was successfully generated (${file})`);
      }
      // Delete the template, if specified by the options.
      if (deleteTemplateAfter) {
        await this._frontendFs.delete(template);
        if (!silent) {
          this._logger.info(`The HTML template was successfully removed (${template})`);
        }
      }

      // Switch the flag, resolve the deferred promise, and delete it.
      this._fileReady = true;
      this._fileDeferred!.resolve();
      this._fileDeferred = undefined;
      return undefined;
    } catch (error) {
      this._fileDeferred!.reject(error);
      this._fileDeferred = undefined;
      if (!silent) {
        this._logger.error('There was an error while generating the HTML');
      }
      throw error;
    }
  }
  /**
   * Gets the customization options.
   */
  get options(): Readonly<HTMLGeneratorOptions> {
    return deepAssignWithOverwrite({}, this._options);
  }
  /**
   * Helper method to get the values that will be replaced in the template. If a "values
   * service" was specified in the constructor, it will get the values from there,
   * otherwise, it will use the `configKeys` option to get the values from the
   * application configuration.
   */
  protected _getValues(): Promise<Record<string, unknown>> {
    if (this._valuesService) {
      return this._valuesService.getValues(this._options);
    }

    const { configKeys } = this._options;
    if (configKeys && configKeys.length) {
      return Promise.resolve(this._config.get(configKeys));
    }

    return Promise.resolve({});
  }
  /**
   * Processes the HTML template by replacing the placeholders with the actual values.
   *
   * @param template  The template for the HTML file.
   * @param values    The values dictionary that should be replaced in the template.
   */
  protected _processHTML(template: string, values: Record<string, unknown>) {
    const { replacePlaceholder, placeholderExpression, variableName } = this._options;
    const htmlObject = JSON.stringify(values);
    let code = template.replace(
      replacePlaceholder,
      `window.${variableName} = ${htmlObject}`,
    );
    const matches: Array<{ string: string; value: string }> = [];
    let match = placeholderExpression.exec(code);
    while (match) {
      const [string, value] = match;
      if (string && value) {
        matches.push({
          string,
          value,
        });
      }

      match = placeholderExpression.exec(code);
    }

    matches.forEach((info) => {
      code = code.replace(info.string, String(get(values, info.value)));
    });

    return code;
  }
}
/**
 * The service provider that once registered on the container will set an instance of
 * {@link HTMLGenerator} as the `htmlGenerator` service. it will also hook itself to the
 * `after-start` event of the application in order to trigger the generator of the HTML
 * file.
 *
 * @example
 *
 * <caption>Basic usage</caption>
 *
 *   // Register it on the container
 *   container.register(htmlGeneratorProvider);
 *   // Getting access to the service instance
 *   const htmlGenerator = container.get<HTMLGenerator>('htmlGenerator');
 *
 * @example
 *
 * <caption>Using with custom options</caption>
 *
 *   container.register(
 *     htmlGeneratorProvider({
 *       serviceName: 'myHtmlGenerator',
 *       valuesServiceName: 'myValuesService',
 *       template: 'my-template.tpl.html',
 *     }),
 *   );
 *
 * @group Providers
 * @group Services/HTMLGenerator
 */
export const htmlGeneratorProvider = providerCreator(
  (options: HTMLGeneratorProviderOptions = {}) =>
    (app) => {
      const {
        serviceName = 'htmlGenerator',
        valuesServiceName = 'htmlGeneratorValues',
        ...rest
      } = options;
      app.set(
        serviceName,
        () =>
          new HTMLGenerator({
            inject: {
              config: app.get('config'),
              logger: app.get('logger'),
              frontendFs: app.get('frontendFs'),
              valuesService: app.try(valuesServiceName),
            },
            ...rest,
          }),
      );

      app.once('afterStart', () => {
        app.get<HTMLGenerator>(serviceName).generateHTML();
      });
    },
);
