/**
 * Escapes a string to be used on `new RegExp(...)`.
 *
 * @param text  The text to escape.
 */
export const escapeForRegExp = (text: string): string =>
  text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
