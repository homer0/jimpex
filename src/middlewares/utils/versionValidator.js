const ObjectUtils = require('wootils/shared/objectUtils');
const statuses = require('statuses');
const { middleware } = require('../../utils/wrappers');

class VersionValidator {
  constructor(
    version,
    responsesBuilder,
    AppError,
    options = {}
  ) {
    this._responsesBuilder = responsesBuilder;
    this._AppError = AppError;
    this._options = ObjectUtils.merge(
      {
        latest: {
          allow: true,
          name: 'latest',
        },
        errors: {
          default: 'The application version doesn\'t match',
          noVersion: 'No version was found on the route',
        },
        popup: {
          variable: 'popup',
          title: 'Conflict',
          message: 'vesion:conflict',
        },
        version,
      },
      options
    );

    if (!this._options.version) {
      throw new Error('You need to supply a version');
    }
  }

  middleware() {
    return (req, res, next) => {
      const { version } = req.params;
      if (!version) {
        next(new this._AppError(
          this._options.errors.noVersion,
          {
            status: statuses['bad request'],
            response: {
              validation: true,
            },
          }
        ));
      } else if (version === this._options.version || this._validateLatest(version)) {
        next();
      } else if (this._isPopup(req)) {
        this._responsesBuilder.htmlPostMessage(
          res,
          this._options.popup.title,
          this._options.popup.message,
          statuses.conflict
        );
      } else {
        next(new this._AppError(
          this._options.errors.default,
          {
            status: statuses.conflict,
            response: {
              validation: true,
            },
          }
        ));
      }
    };
  }

  get options() {
    return this._options;
  }

  _isPopup(req) {
    const popup = req.query[this._options.popup.variable];
    return !!(popup && popup.toLowerCase() === 'true');
  }

  _validateLatest(version) {
    return this._options.latest.allow && version === this._options.latest.name;
  }
}

const versionValidatorCustom = (options) => middleware((app, point) => {
  const validator = new VersionValidator(
    app.get('appConfiguration').get('version'),
    app.get('responsesBuilder'),
    app.get('appError'),
    options
  );

  const middlewareValidator = validator.middleware();
  let result;
  if (point) {
    const router = app.get('router');
    result = [
      router.all('/:version/*', middlewareValidator),
    ];
  } else {
    result = middlewareValidator;
  }

  return result;
});

const versionValidator = versionValidatorCustom();

module.exports = {
  VersionValidator,
  versionValidator,
  versionValidatorCustom,
};
