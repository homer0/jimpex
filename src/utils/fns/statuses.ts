import statuses from 'statuses';

export type Statuses = {
  (code_msg: number | string): number | string;

  codes: number[];
  code: Record<string, number | undefined>;
  empty: Record<number, boolean | undefined>;
  message: Record<number, string | undefined>;
  redirect: Record<number, boolean | undefined>;
  retry: Record<number, boolean | undefined>;
};

export { statuses };
