const mime = require('mime');
const { middleware } = require('../../utils/wrappers');

class FastHTML {
  constructor(
    sendFile,
    file = 'index.html',
    ignoredRoutes = [/^\/api\//, /\.ico$/],
    htmlGenerator = null
  ) {
    this.sendFile = sendFile;
    this.file = file;
    this.ignoredRoutes = ignoredRoutes;
    this.htmlGenerator = htmlGenerator;
    this._ready = true;
    if (this.htmlGenerator) {
      this.file = this.htmlGenerator.getFile();
      this._ready = false;
    }
  }

  middleware() {
    return (req, res, next) => {
      const shouldIgnore = this.ignoredRoutes
      .some((expression) => expression.test(req.originalUrl));

      if (shouldIgnore) {
        next();
      } else if (!this._ready) {
        this.htmlGenerator.whenReady()
        .then(() => {
          this._ready = true;
          this._sendHTML(res, next);
        })
        .catch((error) => {
          next(error);
        });
      }

      return this._sendHTML(res, next);
    };
  }

  _sendHTML(res, next) {
    res.setHeader('Content-Type', mime.getType('html'));
    return this.sendFile(res, this.file, next);
  }
}

const fastHTMLCustom = (
  file,
  ignoredRoutes,
  htmlGeneratorServiceName = 'htmlGenerator'
) => middleware((app) => {
  let htmlGenerator;
  try {
    htmlGenerator = app.get(htmlGeneratorServiceName);
  } catch (ignore) {
    htmlGenerator = null;
  }

  return new FastHTML(
    app.get('sendFile'),
    file,
    ignoredRoutes,
    htmlGenerator
  ).middleware();
});

const fastHTML = fastHTMLCustom();

module.exports = {
  FastHTML,
  fastHTML,
  fastHTMLCustom,
};
