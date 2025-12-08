/**
 * A simple dictionary with unknown values.
 *
 * @group Utilities
 */
export type Dict = Record<string, unknown>;
/**
 * Utility to make a deep "partial" of an existing type.
 *
 * @template T  The type to make a partial of.
 * @group Utilities
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends (infer U)[]
    ? DeepPartial<U>[]
    : T[P] extends object
      ? DeepPartial<T[P]>
      : T[P];
};
/**
 * Utility to make a deep "readonly" of an existing type.
 *
 * @template T  The type to make a readonly of.
 * @group Utilities
 */
export type DeepReadonly<T> = {
  readonly [P in keyof T]: T[P] extends (infer U)[]
    ? DeepReadonly<U>[]
    : T[P] extends object
      ? DeepReadonly<T[P]>
      : T[P];
};
/**
 * Utility to remove string indexes from types.
 *
 * @template T  The type to remove string indexes from.
 * @example
 *
 *   type Foo = {
 *     a: string;
 *     b: string;
 *     [key: string]: string;
 *   };
 *   type Bar = RemoveStringIndexes<Foo>;
 *   // Bar = {
 *   //  a: string;
 *   //  b: string;
 *   // };
 *
 * @group Utilities
 */
export type NoStringIndex<T> = { [K in keyof T as string extends K ? never : K]: T[K] };
