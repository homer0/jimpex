const extend = require('extend');
const mime = require('mime');
const { controller } = require('../../utils/wrappers');

class RootStaticsController {
  constructor(sendFile, files = ['index.html', 'favicon.icon']) {
    this.files = this._parseFiles(files);
    this.sendFile = sendFile;
  }

  getFileEntries() {
    return Object.keys(this.files);
  }

  serveFile(file) {
    if (!this.files[file]) {
      throw new Error(`The required static file doesn't exist (${file})`);
    }

    return (req, res, next) => {
      const item = this.files[file];
      const extension = item.output.split('.').pop().toLowerCase();
      const baseHeaders = { 'Content-Type': mime.getType(extension) };
      const headers = extend(true, baseHeaders, item.headers);

      Object.keys(headers).forEach((headerName) => {
        res.setHeader(headerName, headers[headerName]);
      });

      this.sendFile(res, item.output, next);
    };
  }

  _parseFiles(files) {
    const formattedFiles = {};
    files.forEach((file) => {
      const item = {
        origin: '',
        output: '',
        headers: {},
      };

      if (typeof file === 'object') {
        item.origin = file.origin;
        item.output = file.output;
        item.headers = file.headers || {};
      } else {
        item.origin = file;
        item.output = file;
      }

      formattedFiles[item.origin] = item;
    });

    return formattedFiles;
  }
}

const rootStaticsControllerCustom = (files) => controller((app) => {
  const router = app.get('router');
  const ctrl = new RootStaticsController(app.get('sendFile'), files);
  return ctrl.getFileEntries()
  .map((file) => router.all(`/${file}`, ctrl.serveFile(file)));
});

const rootStaticsController = rootStaticsControllerCustom();

module.exports = {
  RootStaticsController,
  rootStaticsController,
  rootStaticsControllerCustom,
};
