const statuses = require('statuses');
const { provider } = require('../../utils/wrappers');

class EnsureBearerAuthentication {
  constructor(AppError) {
    this.AppError = AppError;
    this.bearerRegex = /bearer .+$/i;
  }

  middleware() {
    return (req, res, next) => {
      const { headers: { authorization } } = req;
      if (authorization && this.bearerRegex.test(authorization)) {
        req.bearerToken = authorization.trim().split(' ').pop();
        return next();
      }

      return next(new this.AppError('Unauthorized', {
        status: statuses.Unauthorized,
      }));
    };
  }
}

const ensureBearerAuthentication = provider((app) => {
  app.set('ensureBearerAuthentication', () => new EnsureBearerAuthentication(
    app.get('appError')
  ).middleware());
});

module.exports = {
  EnsureBearerAuthentication,
  ensureBearerAuthentication,
};
