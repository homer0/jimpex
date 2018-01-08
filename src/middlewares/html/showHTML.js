const mime = require('mime');
const { middleware } = require('../../utils/wrappers');

class ShowHTML {
  constructor(sendFile, file = 'index.html', htmlGenerator = null) {
    this.sendFile = sendFile;
    this.file = file;
    this.htmlGenerator = htmlGenerator;
    this._ready = true;
    if (this.htmlGenerator) {
      this.file = this.htmlGenerator.getFile();
      this._ready = false;
    }
  }

  middleware() {
    return (req, res, next) => {
      if (!this._ready) {
        this.htmlGenerator.whenReady()
        .then(() => {
          this._ready = true;
          this._sendHTML(res, next);
        })
        .catch((error) => {
          next(error);
        });
      }

      this._sendHTML(res, next);
    };
  }

  _sendHTML(res, next) {
    res.setHeader('Content-Type', mime.getType('html'));
    return this.sendFile(res, this.file, next);
  }
}

const showHTMLCustom = (
  file,
  htmlGeneratorServiceName = 'htmlGenerator'
) => middleware((app) => {
  let htmlGenerator;
  try {
    htmlGenerator = app.get(htmlGeneratorServiceName);
  } catch (ignore) {
    htmlGenerator = null;
  }

  return new ShowHTML(
    app.get('sendFile'),
    file,
    htmlGenerator
  ).middleware();
});

const showHTML = showHTMLCustom();

module.exports = {
  ShowHTML,
  showHTML,
  showHTMLCustom,
};
