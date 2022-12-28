import fs from 'fs/promises';
import { provider } from '../../utils';
import type { PathUtils } from '../../types';
/**
 * The options to construct a {@link FrontendFs}.
 *
 * @group Services/FrontendFs
 */
export type FrontendFsOptions = {
  /**
   * A dictionary with the dependencies to inject.
   */
  inject: {
    pathUtils: PathUtils;
  };
};
/**
 * This service allows the application to easily work with the filesystem. The idea behind
 * centralizing this functionalities into a service is that is pretty common to have
 * bundling tools to generate the frontend, and on that process files can have different
 * paths or not even be generated all. The service can be extended/overwritten to
 * accommodate any requirements and avoid having to update or add `if`s to every `fs` call
 * the application does.
 * Another _'feature'_ of this service is that all the paths are relative to the directory
 * where the app executable is located, so you don't have to remember the relative path
 * from the place you are accessing a file to the place where it's located.
 *
 * @group Services
 * @group Services/FrontendFs
 */
export class FrontendFs {
  /**
   * The service that generates the relative paths.
   */
  protected readonly pathUtils: PathUtils;
  /**
   * @param options  The options to construct the service.
   */
  constructor({ inject: { pathUtils } }: FrontendFsOptions) {
    this.pathUtils = pathUtils;
  }
  /**
   * Deletes a file from the file system.
   *
   * @param filepath  The path to the file.
   */
  delete(filepath: string): Promise<void> {
    return fs.unlink(this.getAppPath(filepath));
  }
  /**
   * Reads a file from the file system.
   *
   * @param filepath  The path to the file.
   * @param encoding  The text encoding in which the file should be read.
   */
  read(filepath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    return fs.readFile(this.getAppPath(filepath), encoding);
  }
  /**
   * Writes a file on the file system.
   *
   * @param filepath  The path to the file.
   * @param content   The contents of the file.
   */
  write(filepath: string, content: Parameters<typeof fs.writeFile>[1]): Promise<void> {
    return fs.writeFile(this.getAppPath(filepath), content);
  }
  /**
   * Utility method to get the path of a file relative to the application executable.
   *
   * @param filepath  The path to the file.
   */
  protected getAppPath(filepath: string): string {
    return this.pathUtils.joinFrom('app', filepath);
  }
}
/**
 * The service provider that once registered on the container will set an instance of
 * {@link FrontendFs} as the `frontendFs` service.
 *
 * @example
 *
 *   // Register it on the container
 *   container.register(frontendFsProvider);
 *   // Getting access to the service instance
 *   const frontendFs = container.get<FrontendFs>('frontendFs');
 *
 * @group Providers
 * @group Services/FrontendFs
 */
export const frontendFsProvider = provider((app) => {
  app.set(
    'frontendFs',
    () =>
      new FrontendFs({
        inject: {
          pathUtils: app.get<PathUtils>('pathUtils'),
        },
      }),
  );
});
