const { provider } = require('../../utils/wrappers');

class AppError extends Error {
  constructor(message, extras = {}) {
    super(message);
    this.name = this.constructor.name;
    this.extras = extras;
  }
}

const appError = provider((app) => {
  app.set('appError', () => AppError);
});

module.exports = {
  AppError,
  appError,
};
