const { middleware } = require('../../utils/wrappers');

class ForceHTTPS {
  constructor(ignoredRoutes = [/^\/service\//]) {
    this.ignoredRoutes = ignoredRoutes;
  }

  middleware() {
    return (req, res, next) => {
      if (
        !req.secure &&
        req.get('X-Forwarded-Proto') !== 'https' &&
        !this.ignoredRoutes.some((expression) => expression.test(req.originalUrl))
      ) {
        const host = req.get('Host');
        res.redirect(`https://${host}${req.url}`);
      } else {
        next();
      }
    };
  }
}

const forceHTTPSCustom = (ignoredRoutes) =>
  middleware((app) => (
    app.get('appConfiguration').get('forceHTTPS') ?
      new ForceHTTPS(ignoredRoutes).middleware() :
      null
  ));

const forceHTTPS = forceHTTPSCustom();

module.exports = {
  ForceHTTPS,
  forceHTTPS,
  forceHTTPSCustom,
};
