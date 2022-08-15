import { provider } from '../../utils';
import type { Response, NextFunction, PathUtils } from '../../types';
/**
 * The options to create a {@link SendFile} function.
 *
 * @group Services/SendFile
 */
export type SendFileGeneratorOptions = {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    pathUtils: PathUtils;
  };
};
/**
 * The options for the function that actually serves a file.
 *
 * @group Services/SendFile
 */
export type SendFileOptions = {
  /**
   * The response object sent by the application. Necessary to write the file.
   */
  res: Response;
  /**
   * The path of the file to serve. Depending on the `from` option, it will be either
   * relative to the project root, or the application executable.
   */
  filepath: string;
  /**
   * The name of a location on the `pathUtils` service from where the `filepath` is
   * relative to. It can be `app` for the directory containing the application executable,
   * or `project` for the project root. It could also be any other location that the
   * implementation may have registered.
   *
   * @default 'app'
   */
  from?: string;
  /**
   * The function to move to the next middleware. It can be used to report an error in
   * case the file can't be served.
   *
   * @default {() => {}}
   */
  next?: NextFunction;
};
/**
 * The type of the function that serves a file.
 * This is exported to make it easy to type the dependency injection.
 *
 * @group Services/SendFile
 */
export type SendFile = (options: SendFileOptions) => void;
/**
 * Generates a function to send files on the application response.
 *
 * @param options  To inject the required dependencies.
 * @example
 *
 * <caption>Basic usage</caption>
 *
 *   // Let's say this is inside an Express middleware.
 *   // Get the function
 *   const send = sendFile(pathUtils);
 *   send({ res, filepath: 'some-file.html', next });
 *   // If your app is on "/app/index.js", this will send "/app/some-file.html".
 *
 * @group Services
 * @group Services/SendFile
 */
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

/**
 * The service provider that once registered on the container will set the result of
 * `sendFile(pathUtils)` as the `sendFile` service.
 *
 * @example
 *
 *   // Register it on the container
 *   container.register(sendFileProvider);
 *   // Getting access to the service instance
 *   const sendFile = container.get<SendFile>('sendFile');
 *
 * @group Providers
 * @group Services/SendFile
 */
export const sendFileProvider = provider((app) => {
  app.set('sendFile', () =>
    sendFile({
      inject: {
        pathUtils: app.get('pathUtils'),
      },
    }),
  );
});
