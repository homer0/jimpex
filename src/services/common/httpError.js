const statuses = require('statuses');
const ObjectUtils = require('wootils/shared/objectUtils');
const { provider } = require('../../utils/wrappers');
const { AppError } = require('./appError');

class HTTPError extends AppError {
  constructor(message, status = statuses.ok, context = {}) {
    super(message, ObjectUtils.merge({ status }, context));
  }

  get status() {
    return this.context.status;
  }
}

const httpErrorGenerator = (message, status, context) => new HTTPError(
  message,
  status,
  context
);

const httpError = provider((app) => {
  app.set('HTTPError', () => HTTPError);
  app.set('httpError', () => httpErrorGenerator);
});

module.exports = {
  HTTPError,
  httpError,
};
