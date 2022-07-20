import fs from 'fs/promises';
import { provider } from '../../utils';
import type { PathUtils } from '../../types';

export class FrontendFs {
  constructor(protected readonly pathUtils: PathUtils) {}

  delete(filepath: string): Promise<void> {
    return fs.unlink(this.getAppPath(filepath));
  }

  read(filepath: string, encoding: BufferEncoding = 'utf-8'): Promise<string> {
    return fs.readFile(this.getAppPath(filepath), encoding);
  }

  write(filepath: string, content: Parameters<typeof fs.writeFile>[1]): Promise<void> {
    return fs.writeFile(this.getAppPath(filepath), content);
  }

  protected getAppPath(filepath: string): string {
    return this.pathUtils.joinFrom('app', filepath);
  }
}

export const frontendFsProvider = provider((app) => {
  app.set('frontendFs', () => new FrontendFs(app.get<PathUtils>('pathUtils')));
});
