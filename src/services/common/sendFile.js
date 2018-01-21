const { provider } = require('../../utils/wrappers');

/**
 * @typedef {function} SendFile
 * @param {ExpressResponse} res          Necessary to write the file.
 * @param {String}          filepath     The path to the file relative to where the app executable
 *                                       is located.
 * @param {ExpressNext}     next         To call the send out the error if anything happens.
 * @param {String}          [from='app'] The location it uses to build the relative path. It can be
 *                                       `app` for the directory where the app executable is
 *                                       located, or `home` for the project root directory.
 */

/**
 * Generates a function to send files with path relatives to the app executable file is located.
 * @example
 * // Let's say this is inside an Express middleware.
 * // Get the function
 * const send = sendFile(pathUtils);
 * send(res, 'some-file.html', next);
 * // If your app is on `/app/index.js`, this will send `/app/some-file.html`.
 *
 * @param  {PathUtils} pathUtils To generate the relative paths.
 * @return {SendFile}
 */
const sendFile = (pathUtils) => (res, filepath, next = () => {}, from = 'app') => {
  res.sendFile(pathUtils.joinFrom(from, filepath), (error) => {
    if (error) {
      next(error);
    } else {
      res.end();
    }
  });
};
/**
 * The service provider that once registered on the app container will set the result of
 * `sendFile(pathUtils)` as the `sendFile` service.
 * @example
 * // Register it on the container
 * container.register(sendFileProvider);
 * // Getting access to the service instance
 * const sendFile = container.get('sendFile');
 * @type {Provider}
 */
const sendFileProvider = provider((app) => {
  app.set('sendFile', () => sendFile(app.get('pathUtils')));
});

module.exports = {
  sendFile,
  sendFileProvider,
};
