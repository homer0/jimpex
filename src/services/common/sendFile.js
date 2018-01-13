const { provider } = require('../../utils/wrappers');

const sendFile = (pathUtils) => (res, filepath, next = () => {}, from = 'app') => {
  res.sendFile(pathUtils.joinFrom(from, filepath), (error) => {
    if (error) {
      next(error);
    } else {
      res.end();
    }
  });
};

const sendFileProvider = provider((app) => {
  app.set('sendFile', () => sendFile(app.get('pathUtils')));
});

module.exports = {
  sendFile,
  sendFileProvider,
};
