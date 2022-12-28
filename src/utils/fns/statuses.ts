import statuses from 'statuses';
/**
 * The type definitions for the `statuses` library.
 *
 * While the library has type definitions, TypeScript throws an error that they can't be
 * exported, so that's why they are copied in there.
 */
export type Statuses = {
  /**
   * Given a status code, returns the status text, and given a status text, returns the
   * status code.
   *
   * @param code  The status code or status text to look up.
   * @throws If the status is invalid.
   */
  (code: number | string): number | string;
  /**
   * A list of all the supported status codes.
   */
  codes: number[];
  /**
   * A dictionary with the status texts and their corresponding status codes.
   */
  code: Record<string, number | undefined>;
  /**
   * A dictionary with the status codes and their corresponding status texts, for
   * responses that expect an empty body.
   */
  empty: Record<number, boolean | undefined>;
  /**
   * A dictionary with the status codes and their corresponding status texts.
   */
  message: Record<number, string | undefined>;
  /**
   * A dictionary with status codes for responses that are valid for redirections.
   */
  redirect: Record<number, boolean | undefined>;
  /**
   * A dictionary with status codes that should be retried.
   */
  retry: Record<number, boolean | undefined>;
};

export { statuses };
