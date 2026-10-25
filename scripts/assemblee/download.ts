import { createWriteStream } from 'node:fs';
import { mkdir, rename, stat } from 'node:fs/promises';
import path from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import type { ReadableStream as WebReadableStream } from 'node:stream/web';

export interface DownloadResult {
  downloaded: boolean;
  bytes: number;
}

/** Télécharge `url` vers `dest` sauf si le fichier existe déjà (ou si `force`). */
export async function downloadIfMissing(
  url: string,
  dest: string,
  options: { force: boolean } = { force: false },
): Promise<DownloadResult> {
  if (!options.force) {
    try {
      const existing = await stat(dest);
      if (existing.size > 0) return { downloaded: false, bytes: existing.size };
    } catch {
      // absent : on télécharge
    }
  }
  await mkdir(path.dirname(dest), { recursive: true });
  const res = await fetch(url);
  if (!res.ok || !res.body) {
    throw new Error(`Téléchargement impossible (HTTP ${res.status}) : ${url}`);
  }
  const tmp = `${dest}.part`;
  await pipeline(Readable.fromWeb(res.body as unknown as WebReadableStream), createWriteStream(tmp));
  await rename(tmp, dest);
  const final = await stat(dest);
  return { downloaded: true, bytes: final.size };
}
