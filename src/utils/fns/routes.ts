import { escapeForRegExp } from './text';

/**
 * Removes any leading slash from a URL.
 *
 * @param url  The URL to format.
 * @group Utilities
 */
export const removeLeadingSlash = (url: string): string => url.replace(/^\/+/, '');
/**
 * Removes any trailing slash from a URL.
 *
 * @param url  The URL to format.
 * @group Utilities
 */
export const removeTrailingSlash = (url: string): string => url.replace(/\/+$/, '');
/**
 * Remove any leading and trailing slash from a URL.
 *
 * @param url       The URL to format.
 * @param leading   Whether or not to remove any leading slash.
 * @param trailing  Whether or not to remove the trailing slash.
 * @group Utilities
 */
export const removeSlashes = (
  url: string,
  leading: boolean = true,
  trailing: boolean = true,
) => {
  const newUrl = leading ? removeLeadingSlash(url) : url;
  return trailing ? removeTrailingSlash(newUrl) : newUrl;
};

/**
 * Given a server route definition, this function creates a regular expression to match
 * it: The expression replaces the routes parameters with placeholders so it can be
 * compared with real routes.
 *
 * @param route          The route from which the expression will be created.
 * @param leadingSlash   Whether or not the expression should match a leading slash.
 * @param trailingSlash  Whether or not the expression should match a trailing slash.
 *                       The reason this is `false` by default is because these
 *                       expressions are often used to match against incoming requests,
 *                       and they don't have a trailing slash.
 * @group Utilities
 */
export const createRouteExpression = (
  route: string,
  leadingSlash: boolean = true,
  trailingSlash: boolean = false,
): RegExp => {
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
