import { Injectable } from '@nestjs/common';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join, normalize } from 'path';

/**
 * Dev storage writes under apps/api/.data/uploads.
 * Keys look like tenants/{tenantId}/... and never expose a bucket URL.
 */
@Injectable()
export class StorageService {
  private readonly root = join(process.cwd(), '.data', 'uploads');

  async putObject(storageKey: string, bytes: Buffer): Promise<void> {
    const full = this.resolveKey(storageKey);
    await mkdir(dirname(full), { recursive: true });
    await writeFile(full, bytes);
  }

  async getObject(storageKey: string): Promise<Buffer> {
    return readFile(this.resolveKey(storageKey));
  }

  private resolveKey(storageKey: string): string {
    const cleaned = storageKey.replace(/\\/g, '/').replace(/^\/+/, '');
    const full = normalize(join(this.root, cleaned));
    if (!full.startsWith(this.root)) {
      throw new Error('Invalid storage key');
    }
    return full;
  }
}
