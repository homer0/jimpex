const { controller } = require('../../utils/wrappers');
/**
 * Provides the handler to validate versions on the app routes.
 * The reason this controller exists instead of just using the `versionValidator` middlware is
 * because as a controller, it can mounted on an specific route, otherwise it would have to be
 * implemented on EVERY sub route.
 */
class VersionValidatorController {
  /**
   * Class constructor.
   * @param {ExpressMiddleware} versionValidator The validation middleware.
   */
  constructor(versionValidator) {
    /**
     * A local reference for the `versionValidator` middleware.
     * @type {ExpressMiddleware}
     */
    this.versionValidator = versionValidator;
  }
  /**
   * It just returns the validation middleware.
   * @return {ExpressMiddleware}
   */
  validate() {
    return this.versionValidator;
  }
}
/**
 * This controller registers implements the `versionValidator` middlware on all the sub routes of
 * the mount point. This way the first path component of all the routes on the mount point should
 * match with the app current version.
 * @type {Controller}
 */
const versionValidatorController = controller((app) => {
  const router = app.get('router');
  const ctrl = new VersionValidatorController(
    app.get('versionValidator')
  );

  return [
    router.all('/:version/*', ctrl.validate()),
  ];
});

module.exports = {
  VersionValidatorController,
  versionValidatorController,
};
