import { provider } from '../../utils';
import type { Response, NextFunction, PathUtils } from '../../types';

export type SendFileOptions = {
  res: Response;
  filepath: string;
  from?: string;
  next?: NextFunction;
};

export type SendFile = (options: SendFileOptions) => void;

export const sendFile =
  (pathUtils: PathUtils): SendFile =>
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
  app.set('sendFile', () => sendFile(app.get<PathUtils>('pathUtils')));
});
