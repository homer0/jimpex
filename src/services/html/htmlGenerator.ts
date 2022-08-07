import { get } from '@homer0/object-utils';
import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { deferred, type DeferredPromise } from '@homer0/deferred';
import { providerCreator } from '../../utils';
import type { SimpleConfig, SimpleLogger } from '../../types';
import type { FrontendFs } from '../frontend';
/**
 * The options to customize a {@link HTMLGenerator} instance.
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
   * @default '{{appConfiguration}}'
   */
  replacePlaceholder: string;
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
   * @default 'appConfiguration'
   */
  variableName: string;
  /**
   * A list of settings from the app configuration that will be used as the information to
   * inject on the file.
   *
   * @default ['features', 'version', 'postMessagesPrefix']
   */
  configurationKeys: string[];
};
/**
 * A partial version of the {@link HTMLGeneratorOptions}, to be used in the constructor and
 * the service provider.
 */
type HTMLGeneratorPartialOptions = Partial<HTMLGeneratorOptions>;
/**
 * An external service that can be used to provide the values the generator will replace
 * in the template.
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
 */
export type HTMLGeneratorConstructorOptions = HTMLGeneratorPartialOptions & {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    config: SimpleConfig;
    logger: SimpleLogger;
    frontendFs: FrontendFs;
    /**
     * A service that can provide the values to replace in the template. If specified, the
     * values from `configurationKeys` will be ignored.
     */
    valuesService?: HTMLGeneratorValuesService;
  };
};
/**
 * Custom options for the provider that will register an instance of {@link HTMLGenerator}
 * as a service.
 */
export type HTMLGeneratorProviderOptions = HTMLGeneratorPartialOptions & {
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
   * `configurationKeys` will be ignored.
   *
   * @default 'htmlGeneratorValues'
   */
  valuesServiceName?: string;
};
/**
 * This is a utility service that generates an HTML file with custom information when the
 * application is started.
 */
export class HTMLGenerator {
  /**
   * The service customization options.
   */
  protected readonly options: HTMLGeneratorOptions;
  /**
   * The application configuration service, to get the settings specified by the
   * `configurationKeys` option.
   */
  protected readonly config: SimpleConfig;
  /**
   * The service that logs messages on the terminal, in case the `silent` option is `false`.
   */
  protected readonly logger: SimpleLogger;
  /**
   * The service that interacts with the filesystem.
   */
  protected readonly frontendFs: FrontendFs;
  /**
   * A service that can provide values to be replaced in the template.
   */
  protected readonly valuesService?: HTMLGeneratorValuesService;
  /**
   * Whether or not the file was already generated.
   */
  protected fileReady: boolean = false;
  /**
   * A deferred promise to return when another service asks if the file has been
   * generated. Once this sevice finishes generating the file, the promise will be
   * resolved for all implementations that hold a reference to this deferred.
   */
  protected fileDeferred?: DeferredPromise<void>;
  /**
   * @param options  The options to construct the class.
   * @throws If `valuesService` is specified but it doesn't have a `getValues`
   *         method.
   */
  constructor({
    inject: { config, logger, frontendFs, valuesService },
    ...options
  }: HTMLGeneratorConstructorOptions) {
    this.config = config;
    this.logger = logger;
    this.frontendFs = frontendFs;
    this.valuesService = valuesService;
    this.options = deepAssignWithOverwrite(
      {
        template: 'index.tpl.html',
        file: 'index.html',
        silent: false,
        deleteTemplateAfter: true,
        replacePlaceholder: '{{appConfiguration}}',
        placeholderExpression: /\{\{(.*?)\}\}/gi,
        variableName: 'appConfiguration',
        configurationKeys: ['features', 'version', 'postMessagesPrefix'],
      },
      options,
    );

    if (this.valuesService && typeof this.valuesService.getValues !== 'function') {
      throw new Error('The HTMLGenerator values service must have a `getValues` method');
    }
  }
  /**
   * Gets the customization options.
   */
  getOptions(): Readonly<HTMLGeneratorOptions> {
    return deepAssignWithOverwrite({}, this.options);
  }
  /**
   * Gets a promise that will be resolved when the file has been generated.
   */
  whenReady(): Promise<void> {
    return this.fileDeferred ? this.fileDeferred.promise : Promise.resolve();
  }
  /**
   * Generates the HTML file.
   */
  async generateHTML(): Promise<void> {
    // The file is already generated, and since this is async, return the promise.
    if (this.fileReady) return;
    // If the file is not ready, but the deferred exists, return the reference to the promise.
    // eslint-disable-next-line consistent-return
    if (this.fileDeferred) return this.fileDeferred.promise;
    // Create the deferred promise.
    this.fileDeferred = deferred<void>();
    const { template, deleteTemplateAfter, file, silent } = this.options;
    try {
      // Get the template.
      const templateContents = await this.frontendFs.read(template);
      // Get the values to replace.
      const values = await this.getValues();
      // Replace/process the template.
      const html = this.processHTML(templateContents, values);
      // Write it in the filesystem.
      await this.frontendFs.write(file, html);
      if (!silent) {
        this.logger.success(`The HTML file was successfully generated (${file})`);
      }
      // Delete the template, if specified by the options.
      if (deleteTemplateAfter) {
        await this.frontendFs.delete(template);
        if (!silent) {
          this.logger.info(`The HTML template was successfully removed (${template})`);
        }
      }

      // Switch the flag, resolve the deferred promise, and delete it.
      this.fileReady = true;
      this.fileDeferred!.resolve();
      this.fileDeferred = undefined;
    } catch (error) {
      this.fileDeferred!.reject(error);
      this.fileDeferred = undefined;
      if (!silent) {
        this.logger.error('There was an error while generating the HTML');
      }
      throw error;
    }
  }
  /**
   * Helper method to get the values that will be replaced in the template. If a "values
   * service" was specified in the constructor, it will get the values from there,
   * otherwise, it will use the `configurationKeys` option to get the values from the
   * application configuration.
   */
  protected getValues(): Promise<Record<string, unknown>> {
    if (this.valuesService) {
      return this.valuesService.getValues(this.options);
    }

    const { configurationKeys } = this.options;
    if (configurationKeys && configurationKeys.length) {
      return Promise.resolve(this.config.get(configurationKeys));
    }

    return Promise.resolve({});
  }
  /**
   * Processes the HTML template by replacing the placeholders with the actual values.
   *
   * @param template  The template for the HTML file.
   * @param values    The values dictionary that should be replaced in the template.
   */
  protected processHTML(template: string, values: Record<string, unknown>) {
    const { replacePlaceholder, placeholderExpression, variableName } = this.options;
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
 * `HTMLGenerator` as the `htmlGenerator` service. it will also hook itself to the
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
