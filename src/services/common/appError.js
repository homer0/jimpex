const { provider } = require('../../utils/wrappers');

class AppError extends Error {
  constructor(message, context = {}) {
    super(message);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }

    this.name = this.constructor.name;
    this._context = context;
    this._date = new Date();
  }

  get context() {
    return this._context;
  }

  get date() {
    return this._date;
  }

  get response() {
    return this._context.response || {};
  }
}

const appErrorGenerator = (message, context) => new AppError(message, context);

const appError = provider((app) => {
  app.set('AppError', () => AppError);
  app.set('appError', () => appErrorGenerator);
});

module.exports = {
  AppError,
  appError,
};
