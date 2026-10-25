/** Accès disque partagés par les commandes : lecture JSON avec message utile, test d'existence, chemins relatifs. */
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export async function readJson<T>(file: string, hint?: string): Promise<T> {
  let raw: string;
  try {
    raw = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(`Fichier introuvable : ${rel(file)}${hint ? `. ${hint}` : ''}`);
    }
    throw error;
  }
  return JSON.parse(raw) as T;
}

export async function writeJson(file: string, value: unknown): Promise<void> {
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

export async function exists(file: string): Promise<boolean> {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

/** Chemin relatif au dossier courant, pour les messages console. */
export const rel = (file: string): string => path.relative(process.cwd(), file);

export const IMPORT_HINT = 'Lancez d’abord « pnpm data import ».';
