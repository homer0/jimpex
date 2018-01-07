const { appError } = require('./error');
const { sendFileProvider } = require('./sendFile');
const { provider } = require('../../utils/wrappers');

module.exports = {
  appError,
  sendFile: sendFileProvider,
  all: provider((app) => {
    app.register(appError);
    app.register(sendFileProvider);
  }),
};
