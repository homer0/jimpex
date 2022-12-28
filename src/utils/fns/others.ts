/**
 * A utility function that can be used in `.filter` calls to remove `undefined` values and
 * assert that the type is not longer `undefined`.
 *
 * @param value  The value to check.
 * @template T  The type that is not `undefined`.
 * @example
 *
 *   const arr: (number | undefined)[] = [1, 2, 3, undefined];
 *   const filtered = arr.filter(notUndefined);
 *   // filtered = [1, 2, 3] and its type is number[]
 *
 * @group Utilities
 */
export const notUndefined = <T>(value: T | undefined): value is T => value !== undefined;
