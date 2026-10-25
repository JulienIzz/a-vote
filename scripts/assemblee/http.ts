/**
 * Client HTTP vers le site de l'Assemblée nationale, première maille de la collecte de contexte :
 * `collectContext` (context.ts) lui demande chaque page par URL. Entrée : une URL ; sortie : son HTML,
 * lu dans le cache disque `PAGES_DIR` sinon sur le réseau (délai entre requêtes, timeout, nouvelles
 * tentatives), ou `null` si la page n'existe pas.
 */
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { PAGES_DIR } from '#scripts/paths.ts';

const USER_AGENT = 'a-vote-data/0.1 (outil citoyen de lecture des scrutins)';
const REQUEST_TIMEOUT_MS = 20_000;
/** Délai minimal entre deux requêtes vers le site de l'AN. */
const REQUEST_DELAY_MS = 300;
/** Une tentative initiale plus deux nouvelles sur erreur réseau ou 5xx. */
const MAX_ATTEMPTS = 3;

/** Retourne le HTML d'une page, ou `null` si elle n'existe pas (404). Lève une erreur sinon. */
export type FetchPage = (url: string) => Promise<string | null>;

class HttpError extends Error {
  constructor(
    readonly status: number,
    url: string,
  ) {
    super(`HTTP ${status} : ${url}`);
  }
}

let lastRequestAt = 0;

async function throttle(): Promise<void> {
  const wait = lastRequestAt + REQUEST_DELAY_MS - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

/** Requête HTTP avec délai entre requêtes, timeout et nouvelles tentatives ; `null` sur 404. */
async function httpGet(url: string): Promise<string | null> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt += 1) {
    await throttle();
    try {
      const res = await fetch(url, {
        headers: { 'user-agent': USER_AGENT, accept: 'text/html' },
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
        redirect: 'follow',
      });
      if (res.status === 404 || res.status === 410) return null;
      if (!res.ok) throw new HttpError(res.status, url);
      return await res.text();
    } catch (error) {
      // Les erreurs 4xx sont définitives ; le reste (réseau, timeout, 5xx) se retente.
      if (error instanceof HttpError && error.status < 500) throw error;
      lastError = error;
      if (attempt < MAX_ATTEMPTS) await sleep(REQUEST_DELAY_MS * attempt);
    }
  }
  const reason = lastError instanceof Error ? lastError.message : String(lastError);
  throw new Error(`Échec après ${MAX_ATTEMPTS} tentatives : ${url} (${reason})`);
}

/** Fichier de cache d'une page brute : `PAGES_DIR/<SHA-1 de l'URL>.html`. */
export function pageCachePath(url: string): string {
  return path.join(PAGES_DIR, `${createHash('sha1').update(url).digest('hex')}.html`);
}

/** Chargeur par défaut : cache disque des pages brutes (sauf `force`), puis réseau. */
export function createPageFetcher(options: { force?: boolean } = {}): FetchPage {
  return async (url) => {
    const file = pageCachePath(url);
    if (!options.force) {
      try {
        return await readFile(file, 'utf8');
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
      }
    }
    const html = await httpGet(url);
    if (html !== null) {
      await mkdir(PAGES_DIR, { recursive: true });
      await writeFile(file, html);
    }
    return html;
  };
}
