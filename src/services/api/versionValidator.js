const statuses = require('statuses');
const { provider } = require('../../utils/wrappers');

class VersionValidator {
  constructor(appConfiguration, responsesBuilder, AppError) {
    this.appConfiguration = appConfiguration;
    this.responsesBuilder = responsesBuilder;
    this.AppError = AppError;
  }

  middleware() {
    return (req, res, next) => {
      const reqVersion = req.params.version;
      const { popup } = req.query;
      const isPopup = popup && popup === 'true';
      if (
        reqVersion === 'latest' ||
        reqVersion === this.appConfiguration.get('version')
      ) {
        next();
      } else if (isPopup) {
        this.responsesBuilder.htmlPostMessage(
          res,
          'Conflict',
          'api:conflict',
          statuses.conflict
        );
      } else {
        next(new this.AppError(
          'The API version and the client version are different',
          {
            status: statuses.conflict,
            response: {
              api: true,
            },
          }
        ));
      }
    };
  }
}

const versionValidator = provider((app) => {
  app.set('versionValidator', () => new VersionValidator(
    app.get('appConfiguration'),
    app.get('responsesBuilder'),
    app.get('appError')
  ).middleware());
});

module.exports = {
  VersionValidator,
  versionValidator,
};
