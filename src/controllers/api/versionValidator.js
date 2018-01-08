const { controller } = require('../../utils/wrappers');

class VersionValidatorController {
  constructor(versionValidator) {
    this.versionValidator = versionValidator;
  }

  validate() {
    return this.versionValidator;
  }
}

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
