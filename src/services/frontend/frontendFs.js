const fs = require('fs-extra');
const { provider } = require('../../utils/wrappers');
/**
 * This service allows the app to easily read static files. The idea behind centralizing this
 * functionalities into a service is that is pretty common to have bundling tools to generate the
 * frontend, and on that process files can have different paths or not even be generated all, that's
 * why this service exists. The service can be extended/overwritten to accommodate any
 * requirements and avoid having to update or add `if`s to every `fs` call the app does.
 * Another _'feature'_ of this service is that all the paths are relative to the directory where
 * the app executable is located, so all you don't have to remember the relative path from the place
 * you are accessing a file to the place where it's located.
 */
class FrontendFs {
  /**
   * Class constructor.
   * @param {PathUtils} pathUtils To generate the relative paths.
   */
  constructor(pathUtils) {
    /**
     * A local reference for the `pathUtils` service.
     * @type {PathUtils}
     */
    this.pathUtils = pathUtils;
  }
  /**
   * Read a file from the file system.
   * @param {string} filepath           The path to the file.
   * @param {string} [encoding='utf-8'] The text encoding in which the file should be read.
   * @return {Promise<string,Error>}
   */
  read(filepath, encoding = 'utf-8') {
    return fs.readFile(this.pathUtils.joinFrom('app', filepath), encoding);
  }
  /**
   * Write a file on the file system.
   * @param {string} filepath The path to the file.
   * @param {string} data     The contents of the file.
   * @return {Promise<undefined,Error>}
   */
  write(filepath, data) {
    return fs.writeFile(this.pathUtils.joinFrom('app', filepath), data);
  }
  /**
   * Delete a file from the file system.
   * @param {string} filepath The path to the file.
   * @return {Promise<undefined,Error>}
   */
  delete(filepath) {
    return fs.unlink(this.pathUtils.joinFrom('app', filepath));
  }
}
/**
 * The service provider that once registered on the app container will set an instance of
 * `FrontendFs` as the `frontendFs` service.
 * @example
 * // Register it on the container
 * container.register(frontendFs);
 * // Getting access to the service instance
 * const frontendFs = container.get('frontendFs');
 * @type {Provider}
 */
const frontendFs = provider((app) => {
  app.set('frontendFs', () => new FrontendFs(app.get('pathUtils')));
});

module.exports = {
  FrontendFs,
  frontendFs,
};
