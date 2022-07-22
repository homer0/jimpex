import { get } from '@homer0/object-utils';
import { deepAssignWithOverwrite } from '@homer0/deep-assign';
import { deferred, type DeferredPromise } from '@homer0/deferred';
import { providerCreator } from '../../utils';
import type { SimpleConfig, SimpleLogger } from '../../types';
import type { FrontendFs } from '../frontend';

export type HTMLGeneratorOptions = {
  template: string;
  file: string;
  silent: boolean;
  deleteTemplateAfter: boolean;
  replacePlaceholder: string;
  placeholderExpression: RegExp;
  variableName: string;
  configurationKeys: string[];
};

export type HTMLGeneratorValuesService = {
  getValues: (options: HTMLGeneratorOptions) => Promise<Record<string, unknown>>;
};

export type HTMLGeneratorConstructorOptions = Partial<HTMLGeneratorOptions> & {
  inject: {
    config: SimpleConfig;
    logger: SimpleLogger;
    frontendFs: FrontendFs;
    valuesService?: HTMLGeneratorValuesService;
  };
};

export type HTMLGeneratorProviderOptions = Partial<HTMLGeneratorOptions> & {
  serviceName?: string;
  valuesServiceName?: string;
};

export class HTMLGenerator {
  protected readonly options: HTMLGeneratorOptions;
  protected readonly config: SimpleConfig;
  protected readonly logger: SimpleLogger;
  protected readonly frontendFs: FrontendFs;
  protected readonly valuesService?: HTMLGeneratorValuesService;
  protected fileReady: boolean = false;
  protected fileDeferred?: DeferredPromise<void>;

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

  getOptions(): Readonly<HTMLGeneratorOptions> {
    return deepAssignWithOverwrite({}, this.options);
  }

  whenReady(): Promise<void> {
    return this.fileDeferred ? this.fileDeferred.promise : Promise.resolve();
  }

  async generateHTML(): Promise<void> {
    if (this.fileReady) return;
    // eslint-disable-next-line consistent-return
    if (this.fileDeferred) return this.fileDeferred.promise;

    this.fileDeferred = deferred<void>();
    const { template, deleteTemplateAfter, file, silent } = this.options;
    try {
      const templateContents = await this.frontendFs.read(template);
      const values = await this.getValues();
      const html = this.processHTML(templateContents, values);
      await this.frontendFs.write(file, html);
      if (!silent) {
        this.logger.success(`The HTML file was successfully generated (${file})`);
      }
      if (deleteTemplateAfter) {
        await this.frontendFs.delete(template);
        if (!silent) {
          this.logger.info(`The HTML template was successfully removed (${template})`);
        }
      }

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
