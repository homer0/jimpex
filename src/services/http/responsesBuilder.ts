import type { SimpleConfig, Response } from '../../types';
import { provider, type Statuses } from '../../utils';

export type ResponsesBuilderConstructorOptions = {
  inject: {
    config: SimpleConfig;
    statuses: Statuses;
  };
};

export type HTMLPostMessageResponseOptions = {
  res: Response;
  title: string;
  message: string;
  status?: number | string;
  target?: string;
  close?: boolean;
  closeDelay?: number;
};

export type JSONResponseOptions = {
  res: Response;
  data: unknown;
  status?: number | string;
  metadata?: object;
};

const DEFAULT_CLOSE_DELAY_FOR_POST_MESSAGE = 700;

export class ResponsesBuilder {
  protected readonly config: SimpleConfig;
  protected readonly statuses: Statuses;

  constructor({ inject: { config, statuses } }: ResponsesBuilderConstructorOptions) {
    this.config = config;
    this.statuses = statuses;
  }

  htmlPostMessage(options: HTMLPostMessageResponseOptions): void {
    const {
      res,
      title,
      message,
      status,
      target = 'window.opener',
      close = true,
      closeDelay = DEFAULT_CLOSE_DELAY_FOR_POST_MESSAGE,
    } = options;
    const prefix = this.config.get<string | undefined>('postMessagesPrefix') ?? '';
    const closeCode = close
      ? `setTimeout(function() { window.close(); }, ${closeDelay});`
      : '';

    const html = this.htmlTemplate(
      title,
      `
      (function() {
        if (${target}) {
          ${target}.postMessage('${prefix}${message}', '*');
          ${closeCode}
        }
      })();
      `,
    );

    const useStatus =
      typeof status === 'undefined'
        ? (this.statuses('ok') as number)
        : this.normalizeStatus(status);

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'no-cache, max-age=0, must-revalidate, no-store');
    res.status(useStatus);
    res.write(html);
    res.end();
  }

  json(options: JSONResponseOptions): void {
    const { res, data, status, metadata = {} } = options;
    const useStatus =
      typeof status === 'undefined'
        ? (this.statuses('ok') as number)
        : this.normalizeStatus(status);

    res.status(useStatus);
    res.json({
      metadata: {
        version: this.config.get<string>('version'),
        status: useStatus,
        ...metadata,
      },
      data,
    });
    res.end();
  }

  protected htmlTemplate(title: string, code: string): string {
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

  protected normalizeStatus(status: number | string): number {
    let useStatus: number;
    try {
      if (typeof status === 'string') {
        useStatus = this.statuses(status) as number;
      } else {
        this.statuses(status);
        useStatus = status;
      }
    } catch (_) {
      useStatus = this.statuses('ok') as number;
    }

    return useStatus;
  }
}

export const responsesBuilderProvider = provider((app) => {
  app.set(
    'responsesBuilder',
    () =>
      new ResponsesBuilder({
        inject: {
          config: app.get<SimpleConfig>('config'),
          statuses: app.get<Statuses>('statuses'),
        },
      }),
  );
});
