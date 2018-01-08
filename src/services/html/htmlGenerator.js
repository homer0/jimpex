const extend = require('extend');
const deferred = require('wootils/shared/deferred');
const { provider } = require('../../utils/wrappers');

class HTMLGenerator {
  constructor(
    options,
    valuesService,
    appConfiguration,
    appLogger,
    frontendFs
  ) {
    this.options = extend({
      template: 'index.tpl.html',
      file: 'index.html',
      deleteTemplateAfter: true,
      replacePlaceholder: '{{appConfiguration}}',
      variable: 'appConfiguration',
      configurationKeys: ['features', 'version', 'postMessagesPrefix'],
    }, options);

    if (valuesService && typeof valuesService.getValues !== 'function') {
      throw new Error('The HTMLGenerator values service must have a `getValues` method');
    }

    this.valuesService = valuesService;
    this.appConfiguration = appConfiguration;
    this.appLogger = appLogger;
    this.frontendFs = frontendFs;

    this._fileReady = false;
    this._fileDeferred = deferred();
  }

  whenReady() {
    return this._fileReady ?
      Promise.resolve() :
      this._fileDeferred.promise;
  }

  getFile() {
    return this.options.file;
  }

  getValues() {
    let valuesPromise;
    if (this.valuesService) {
      valuesPromise = this.valuesService.getValues();
    } else if (this.options.configurationKeys.length) {
      valuesPromise = Promise.resolve(
        this.appConfiguration.get(this.options.configurationKeys)
      );
    } else {
      valuesPromise = Promise.resolve({});
    }

    return valuesPromise;
  }

  generateHTML() {
    const {
      template,
      deleteTemplateAfter,
      replaceKey,
      variable,
      file,
    } = this.options;

    let templateContents = '';
    return this.frontendFs.read(`./${template}`)
    .then((contents) => {
      templateContents = contents;
      return this.getValues();
    })
    .then((values) => {
      const htmlObject = JSON.stringify(values);
      const html = templateContents
      .replace(
        replaceKey,
        `window.${variable} = ${htmlObject}`
      );

      return this.frontendFs.write(file, html);
    })
    .then(() => {
      this.appLogger.success(`The HTML was successfully generated (${file})`);
      return deleteTemplateAfter ? this.frontendFs.delete(`/${template}`) : {};
    })
    .then(() => {
      if (deleteTemplateAfter) {
        this.appLogger.info(`The HTML template was successfully removed (${template})`);
      }

      this._fileReady = true;
      this._fileDeferred.resolve();
    })
    .catch((error) => {
      this.appLogger.error('There was an error while generating the HTML');
      this.appLogger.error(error);
    });
  }
}

const htmlGeneratorCustom = (
  options,
  valuesServiceName,
  serviceName = 'htmlGenerator'
) => provider((app) => {
  app.set(serviceName, () => {
    let valuesService = null;
    if (valuesServiceName) {
      valuesService = app.get(valuesServiceName);
    }

    return new HTMLGenerator(
      options || {},
      valuesService,
      app.get('appConfiguration'),
      app.get('appLogger'),
      app.get('frontendFs')
    );
  });

  app.get('events').once('afterStart', () => {
    app.get(serviceName).generateHTML();
  });
});

const htmlGenerator = htmlGeneratorCustom();

module.exports = {
  HTMLGenerator,
  htmlGenerator,
  htmlGeneratorCustom,
};
