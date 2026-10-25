import AdmZip from 'adm-zip';

export interface ZipJsonEntry<T> {
  name: string;
  data: T;
}

/** Itère les entrées JSON d'une archive zip sans l'extraire sur disque. */
export function* readZipJson<T>(zipPath: string, match: (entryName: string) => boolean): Generator<ZipJsonEntry<T>> {
  const zip = new AdmZip(zipPath);
  for (const entry of zip.getEntries()) {
    if (entry.isDirectory || !match(entry.entryName)) continue;
    yield { name: entry.entryName, data: JSON.parse(entry.getData().toString('utf8')) as T };
  }
}
