/**
 * Removes any leading slash from a URL.
 *
 * @param {string} url The URL to format.
 * @returns {string}
 */
const removeLeadingSlash = (url) => url.replace(/^\/+/, '');
/**
 * Removes any trailing slash from a URL.
 *
 * @param {string} url The URL to format.
 * @returns {string}
 */
const removeTrailingSlash = (url) => url.replace(/\/+$/, '');
/**
 * Remove any leading and trailing slash from a URL.
 *
 * @param {string}  url             The URL to format.
 * @param {boolean} [leading=true]  Whether or not to remove any leading slash.
 * @param {boolean} [trailing=true] Whether or not to remove the trailing slash.
 * @returns {string}
 */
const removeSlashes = (url, leading = true, trailing = true) => {
  const newUrl = leading ? removeLeadingSlash(url) : url;
  return trailing ? removeTrailingSlash(newUrl) : newUrl;
};
/**
 * Escapes a string to be used on `new RegExp(...)`.
 *
 * @param {string} text The text to escape.
 * @returns {string}
 */
const escapeForRegExp = (text) => text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
/**
 * Given a server route definition, this function creates a regular expression to match
 * it: The expression replaces the routes parameters with placeholders so it can be compared
 * with real routes.
 *
 * @param {string}  route                 The route from which the expression will be created.
 * @param {boolean} [leadingSlash=true]   Whether or not the expression should match a leading
 *                                        slash.
 * @param {boolean} [trailingSlash=false] Whether or not the expression should match a trailing
 *                                        slash. The reason this is `false` by default is because
 *                                        these expressions are often used to match against
 *                                        incoming requests, and they don't have a trailing slash.
 * @returns {RegExp}
 */
const createRouteExpression = (route, leadingSlash = true, trailingSlash = false) => {
  let expression = removeSlashes(route)
  .split('/')
  .map((part) => (part.startsWith(':') ? '(?:([^\\/]+?))' : escapeForRegExp(part)))
  .join('\\/');
  if (leadingSlash) {
    expression = `\\/${expression}`;
  }
  if (trailingSlash) {
    expression = `${expression}\\/`;
  }

  return new RegExp(expression);
};

module.exports.createRouteExpression = createRouteExpression;
module.exports.escapeForRegExp = escapeForRegExp;
module.exports.removeLeadingSlash = removeLeadingSlash;
module.exports.removeSlashes = removeSlashes;
module.exports.removeTrailingSlash = removeTrailingSlash;
