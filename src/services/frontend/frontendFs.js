const fs = require('fs-extra');
const { provider } = require('../../utils/wrappers');

class FrontendFs {
  constructor(pathUtils) {
    this.pathUtils = pathUtils;
  }

  read(filepath, encoding = 'utf-8') {
    return fs.readFile(this.pathUtils.joinFrom('app', filepath), encoding);
  }

  write(filepath, data) {
    return fs.writeFile(this.pathUtils.joinFrom('app', filepath), data);
  }

  delete(filepath) {
    return fs.unlink(this.pathUtils.joinFrom('app', filepath));
  }
}

const frontendFs = provider((app) => {
  app.set('frontendFs', () => new FrontendFs(app.get('pathUtils')));
});

module.exports = {
  FrontendFs,
  frontendFs,
};
