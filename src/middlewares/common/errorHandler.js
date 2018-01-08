const statuses = require('statuses');
const { middleware } = require('../../utils/wrappers');

class ErrorHandler {
  constructor(appLogger, responsesBuilder, showErrors, AppError) {
    this.appLogger = appLogger;
    this.responsesBuilder = responsesBuilder;
    this.showErrors = showErrors;
    this.AppError = AppError;
  }

  middleware() {
    return (err, req, res, next) => {
      if (err) {
        let data = {
          error: true,
          message: 'Oops! Something went wrong, please try again',
        };

        let status = statuses['Internal Server error'];
        const knownError = err instanceof this.AppError;

        if (this.showErrors || knownError) {
          data.message = err.message;
          if (knownError) {
            if (err.extras.response) {
              data = Object.assign(data, err.extras.response);
            }

            status = err.extras.status || statuses['Bad Request'];
          }
        }

        const stack = err.stack.split('\n').map((line) => line.trim());

        if (this.showErrors) {
          data.stack = stack;
          stack.splice(0, 1);
          this.appLogger.error(`ERROR: ${err.message}`);
          this.appLogger.info(stack);
        }

        return this.responsesBuilder.json(res, data, status);
      }

      return next();
    };
  }
}

const errorHandler = middleware((app) => {
  const debugging = app.get('appConfiguration').get('debug');
  const showErrors = debugging && debugging.showErrors;
  return new ErrorHandler(
    app.get('appLogger'),
    app.get('responsesBuilder'),
    showErrors,
    app.get('appError')
  )
  .middleware();
});

module.exports = {
  ErrorHandler,
  errorHandler,
};
