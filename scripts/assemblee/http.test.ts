import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { pageCachePath } from '#scripts/assemblee/http.ts';
import { PAGES_DIR } from '#scripts/paths.ts';

describe('pageCachePath', () => {
  it('nomme la page en cache par le SHA-1 de son URL, dans le cache des pages', () => {
    const url = 'https://www.assemblee-nationale.fr/dyn/17/scrutins/8431';
    const file = pageCachePath(url);
    expect(path.dirname(file)).toBe(PAGES_DIR);
    // Empreinte figée : les pages déjà en cache doivent rester retrouvées après tout refactor.
    expect(path.basename(file)).toBe('6b251e433b6f0803ce786b57c0504676b71896ac.html');
    expect(pageCachePath(`${url}/`)).not.toBe(file);
  });
});
