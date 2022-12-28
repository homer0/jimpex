import { provider } from '../../utils';
import type { Response, NextFunction, PathUtils } from '../../types';

export type SendFileGeneratorOptions = {
  inject: {
    pathUtils: PathUtils;
  };
};

export type SendFileOptions = {
  res: Response;
  filepath: string;
  from?: string;
  next?: NextFunction;
};

export type SendFile = (options: SendFileOptions) => void;

export const sendFile =
  ({ inject: { pathUtils } }: SendFileGeneratorOptions): SendFile =>
  ({ res, filepath, from = 'app', next = () => {} }) => {
    res.sendFile(pathUtils.joinFrom(from, filepath), (error) => {
      if (error) {
        next(error);
      } else {
        res.end();
      }
    });
  };

export const sendFileProvider = provider((app) => {
  app.set('sendFile', () =>
    sendFile({
      inject: {
        pathUtils: app.get<PathUtils>('pathUtils'),
      },
    }),
  );
});
