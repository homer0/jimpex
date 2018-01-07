const statuses = require('statuses');
const { provider } = require('../../utils/wrappers');

class ResponsesBuilder {
  constructor(appConfiguration) {
    this.appConfiguration = appConfiguration;
  }

  json(res, data, status = statuses.ok, metadata = {}) {
    res
    .status(status)
    .json({
      metadata: Object.assign({
        version: this.appConfiguration.get('version'),
        status,
      }, metadata),
      data,
    })
    .end();
  }

  htmlPostMessage(
    res,
    title,
    message,
    status = statuses.ok,
    options = {}
  ) {
    const prefix = this.appConfiguration.get('postMessagesPrefix') || '';
    const target = options.target || 'window.opener';
    const close = typeof options.close !== 'undefined' ? options.close : true;
    const defaultCloseDelay = 700;
    const closeDelay = options.closeDelay || defaultCloseDelay;
    const closeCode = close ?
      `setTimeout(function() { window.close(); }, ${closeDelay});` :
      '';
    const html = this._htmlTemplate(title, `
      (function() {
        if (${target}) {
          ${target}.postMessage('${prefix}${message}', '*');
          ${closeCode}
        }
      })();
      `);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
    res.status(status);
    res.write(html);
    res.end();
  }

  _htmlTemplate(title, code) {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8" />
          <meta http-equiv="x-ua-compatible" content="ie=edge" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <title>${title}</title>
        </head>
        <body>
          <script type="text/javascript">
          ${code}
        </script>
      </body>
    </html>
    `;
  }
}

const responsesBuilder = provider((app) => {
  app.set('responsesBuilder', () => new ResponsesBuilder(
    app.get('appConfiguration')
  ));
});

module.exports = {
  ResponsesBuilder,
  responsesBuilder,
};
