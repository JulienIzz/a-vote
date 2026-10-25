import { mkdtemp, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Scrutin } from '#data/model/types.ts';
import { collectContext, contextCachePath, readCachedContext } from '#scripts/assemblee/context.ts';
import { ARTICLES_MAX_CHARS, EXPOSE_MAX_CHARS } from '#scripts/assemblee/document.ts';
import {
  AN,
  documentHtml,
  NOMINAL_PAGES,
  scrutin8431,
  scrutinPageHtml,
  textPageHtml,
} from '#scripts/assemblee/fixtures.ts';
import type { FetchPage } from '#scripts/assemblee/http.ts';

/** Chargeur sans réseau : `null` (404) pour toute URL absente de `pages`. */
function fakeFetcher(pages: Record<string, string>): { fetchPage: FetchPage; calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    fetchPage: async (url) => {
      calls.push(url);
      return pages[url] ?? null;
    },
  };
}

let cacheDir: string;
beforeAll(async () => {
  cacheDir = await mkdtemp(path.join(os.tmpdir(), 'a-vote-context-'));
});
afterAll(async () => {
  await rm(cacheDir, { recursive: true, force: true });
});

describe('collectContext', () => {
  it('cas nominal : scrutin → dossier → texte déposé → document', async () => {
    const { fetchPage, calls } = fakeFetcher(NOMINAL_PAGES);
    const ctx = await collectContext(scrutin8431, { force: true, fetchPage, cacheDir });
    expect(calls).toEqual(Object.keys(NOMINAL_PAGES));
    expect(ctx.uid).toBe('VTANR5L17V8431');
    expect(ctx.legislature).toBe(17);
    expect(ctx.scrutinUrl).toBe(`${AN}/dyn/17/scrutins/8431`);
    expect(ctx.dossier).toEqual({
      url: `${AN}/dyn/17/dossiers/proteger_mineurs_reseaux_sociaux_17e`,
      title: 'Protéger les mineurs des risques auxquels les expose l’utilisation des réseaux sociaux',
    });
    expect(ctx.text).toEqual({
      url: `${AN}/dyn/17/textes/l17b2107_proposition-loi`,
      title:
        'Proposition de loi visant à protéger les mineurs des risques auxquels les expose l’utilisation des réseaux sociaux',
      number: '2107',
      kind: 'proposition-de-loi',
    });
    expect(ctx.exposeDesMotifs).toMatch(/^Mesdames, Messieurs,\nLe 11 septembre 2025/);
    expect(ctx.articles).toMatch(/^Article 1er\nLe code pénal/);
    expect(ctx.sources.map((s) => s.status)).toEqual(['ok', 'ok', 'ok', 'ok']);
    expect(ctx.warnings).toEqual([]);
    expect(Date.parse(ctx.collectedAt)).not.toBeNaN();
  });

  it('écrit le contexte en cache et le relit sans réseau', async () => {
    const { fetchPage } = fakeFetcher(NOMINAL_PAGES);
    const fresh = await collectContext(scrutin8431, { force: true, fetchPage, cacheDir });
    expect(contextCachePath(scrutin8431.uid, cacheDir)).toBe(path.join(cacheDir, 'VTANR5L17V8431.json'));
    expect(await readCachedContext(scrutin8431.uid, cacheDir)).toEqual(fresh);
    expect(await readCachedContext('VTANR5L17V0', cacheDir)).toBeNull();

    const offline: FetchPage = async () => {
      throw new Error('réseau coupé');
    };
    const cached = await collectContext(scrutin8431, { fetchPage: offline, cacheDir });
    expect(cached).toEqual(fresh);
  });

  it('passe par le compte rendu de séance quand la page du scrutin ne renvoie pas au dossier', async () => {
    const pages: Record<string, string> = {
      ...NOMINAL_PAGES,
      [`${AN}/dyn/17/scrutins/8431`]: scrutinPageHtml({ dossier: false }),
      [`${AN}/dyn/17/comptes-rendus/seance/CRSANR5L17S2026O1N300`]: `<html><body><div id="dosLegListeTipsy"><ul>
        <li><a href="/dyn/17/dossiers/autre_dossier"><span>Accorder le versement des allocations familiales dès le premier enfant</span></a></li>
        <li><a href="/dyn/17/dossiers/proteger_mineurs_reseaux_sociaux_17e"><span>Protéger les mineurs des risques auxquels les expose l’utilisation des réseaux sociaux</span></a></li>
      </ul></div></body></html>`,
    };
    const { fetchPage, calls } = fakeFetcher(pages);
    const ctx = await collectContext(scrutin8431, { force: true, fetchPage, cacheDir });
    expect(calls[1]).toBe(`${AN}/dyn/17/comptes-rendus/seance/CRSANR5L17S2026O1N300`);
    expect(ctx.dossier?.url).toBe(`${AN}/dyn/17/dossiers/proteger_mineurs_reseaux_sociaux_17e`);
    expect(ctx.text?.number).toBe('2107');
    expect(ctx.exposeDesMotifs).not.toBeNull();
    expect(ctx.warnings).toEqual([]);
  });

  it('consulte les dossiers candidats quand le compte rendu les liste sous un titre initial différent', async () => {
    // Texte renommé en cours d'examen : le compte rendu liste le dossier sous le titre d'origine,
    // mais la page du dossier porte le titre final dans l'infobulle du bouton « Texte adopté ».
    const renamed: Scrutin = {
      ...scrutin8431,
      uid: 'VTANR5L17V289',
      numero: 289,
      title:
        "l'ensemble de la proposition de loi visant à renforcer les outils de régulation des meublés de tourisme à l'échelle locale (texte de la commission mixte paritaire).",
      sourceUrl: `${AN}/dyn/17/scrutins/289`,
    };
    const pages: Record<string, string> = {
      [`${AN}/dyn/17/scrutins/289`]: scrutinPageHtml({
        dossier: false,
        numero: 289,
        title: `${renamed.title.slice(0, -1).replace(/'/g, '&#039;')}.`,
      }),
      [`${AN}/dyn/17/comptes-rendus/seance/CRSANR5L17S2026O1N300`]: `<html><body><div id="dosLegListeTipsy"><ul>
        <li><a href="/dyn/17/dossiers/locatif_zone_tendue"><span>Remédier aux déséquilibres du marché locatif en zone tendue</span></a></li>
        <li><a href="/dyn/17/dossiers/PLF2025"><span>Projet de loi de finances pour 2025</span></a></li>
      </ul></div></body></html>`,
      [`${AN}/dyn/17/dossiers/locatif_zone_tendue`]: `<html><body><h1 class="h1 _small">Remédier aux déséquilibres du marché locatif en zone tendue</h1>
        <div class="acte-legislatif-bloc _niveau-1 _static" data-id="L17-VD1 (DepotInitiative / -DEPOT)">
          <a href="https://www.assemblee-nationale.fr/dyn/17/textes/l17b1176_proposition-loi" class="link" data-document-id="PIONANR5L17B1176"><span>Proposition de loi visant à remédier aux déséquilibres du marché locatif en zone tendue, n°&nbsp;1176</span></a>
        </div>
        <div class="acte-legislatif-bloc _niveau-1 _static" data-id="L17-CMP-1 (Etape / CMP)">
          <a href="https://www.assemblee-nationale.fr/dyn/17/textes/l17t0023_texte-adopte-seance" class="button" data-tipsy='Accéder à la page du document "Proposition de loi, adoptée, dans les conditions prévues à l&#039;article 45, alinéa 3, de la Constitution, par l&#039;Assemblée nationale, visant à renforcer les outils de régulation des meublés de tourisme à l&#039;échelle locale le 7 novembre 2024, T.A. n° 23"'> Texte adopté ✅ </a>
        </div></body></html>`,
      [`${AN}/dyn/17/dossiers/PLF2025`]: `<html><body><h1 class="h1 _small">Projet de loi de finances pour 2025</h1>
        <div class="acte-legislatif-bloc _niveau-1 _static" data-id="L17-VD2 (DepotInitiative / -DEPOT)">
          <a href="https://www.assemblee-nationale.fr/dyn/17/textes/l17b0324_projet-loi" class="link"><span>Projet de loi de finances pour 2025, n°&nbsp;324</span></a>
        </div></body></html>`,
      [`${AN}/dyn/17/textes/l17b1176_proposition-loi`]: textPageHtml.replace('PIONANR5L17B2107', 'PIONANR5L17B1176'),
      [`${AN}/dyn/docs/PIONANR5L17B1176.raw`]: documentHtml(),
    };
    const { fetchPage, calls } = fakeFetcher(pages);
    const ctx = await collectContext(renamed, { force: true, fetchPage, cacheDir });
    expect(calls).toEqual([
      `${AN}/dyn/17/scrutins/289`,
      `${AN}/dyn/17/comptes-rendus/seance/CRSANR5L17S2026O1N300`,
      `${AN}/dyn/17/dossiers/locatif_zone_tendue`,
      `${AN}/dyn/17/dossiers/PLF2025`,
      `${AN}/dyn/17/textes/l17b1176_proposition-loi`,
      `${AN}/dyn/docs/PIONANR5L17B1176.raw`,
    ]);
    expect(ctx.dossier).toEqual({
      url: `${AN}/dyn/17/dossiers/locatif_zone_tendue`,
      title: 'Remédier aux déséquilibres du marché locatif en zone tendue',
    });
    expect(ctx.text).toMatchObject({ number: '1176', kind: 'proposition-de-loi' });
    expect(ctx.exposeDesMotifs).not.toBeNull();
    expect(ctx.warnings).toEqual([]);
  });

  it('dossier absent : contexte dégradé avec avertissement', async () => {
    const { fetchPage, calls } = fakeFetcher({
      [`${AN}/dyn/17/scrutins/8431`]: scrutinPageHtml({ dossier: false, compteRendu: false }),
    });
    const ctx = await collectContext(scrutin8431, { force: true, fetchPage, cacheDir });
    expect(calls).toHaveLength(1);
    expect(ctx.dossier).toBeNull();
    expect(ctx.text).toBeNull();
    expect(ctx.exposeDesMotifs).toBeNull();
    expect(ctx.articles).toBeNull();
    expect(ctx.sources).toEqual([{ url: `${AN}/dyn/17/scrutins/8431`, status: 'ok' }]);
    expect(ctx.warnings).toEqual([
      'Aucun lien vers un dossier législatif ni vers un compte rendu sur la page du scrutin.',
    ]);
  });

  it('page 404 : source « missing », pas de plantage', async () => {
    const { fetchPage } = fakeFetcher({});
    const ctx = await collectContext(scrutin8431, { force: true, fetchPage, cacheDir });
    expect(ctx.sources).toEqual([{ url: `${AN}/dyn/17/scrutins/8431`, status: 'missing' }]);
    expect(ctx.warnings).toEqual([`Page du scrutin introuvable (404) : ${AN}/dyn/17/scrutins/8431`]);
    expect(ctx.text).toBeNull();

    // 404 plus loin dans la chaîne : le dossier est connu, le texte aussi, mais pas son document.
    const partial = { ...NOMINAL_PAGES };
    delete partial[`${AN}/dyn/docs/PIONANR5L17B2107.raw`];
    const ctx2 = await collectContext(scrutin8431, {
      force: true,
      fetchPage: fakeFetcher(partial).fetchPage,
      cacheDir,
    });
    expect(ctx2.dossier).not.toBeNull();
    expect(ctx2.text?.number).toBe('2107');
    expect(ctx2.exposeDesMotifs).toBeNull();
    expect(ctx2.sources.at(-1)).toEqual({ url: `${AN}/dyn/docs/PIONANR5L17B2107.raw`, status: 'missing' });
    expect(ctx2.warnings).toEqual([`Document du texte introuvable (404) : ${AN}/dyn/docs/PIONANR5L17B2107.raw`]);
  });

  it('erreur réseau : source « error » avec le message, pas de plantage', async () => {
    const fetchPage: FetchPage = async (url) => {
      if (url.includes('/dossiers/')) throw new Error('Échec après 3 tentatives : HTTP 503');
      return NOMINAL_PAGES[url] ?? null;
    };
    const ctx = await collectContext(scrutin8431, { force: true, fetchPage, cacheDir });
    expect(ctx.sources[1]).toEqual({
      url: `${AN}/dyn/17/dossiers/proteger_mineurs_reseaux_sociaux_17e`,
      status: 'error',
      note: 'Échec après 3 tentatives : HTTP 503',
    });
    expect(ctx.dossier).toBeNull();
    expect(ctx.warnings[0]).toMatch(/^Dossier législatif : erreur de chargement/);
  });

  it('page du scrutin incohérente avec le scrutin attendu : on ne suit pas le lien', async () => {
    const pages = {
      ...NOMINAL_PAGES,
      [`${AN}/dyn/17/scrutins/8431`]: scrutinPageHtml({
        title: 'la motion de censure déposée en application de l&#039;article 49, alinéa 2, de la Constitution.',
      }),
    };
    const { fetchPage, calls } = fakeFetcher(pages);
    const ctx = await collectContext(scrutin8431, { force: true, fetchPage, cacheDir });
    expect(calls).toHaveLength(1);
    expect(ctx.dossier).toBeNull();
    expect(ctx.warnings[0]).toMatch(/^La page du scrutin ne correspond pas au scrutin attendu/);
  });

  it('vote du Congrès : aucune page consultée, contexte dégradé', async () => {
    const congres: Scrutin = {
      ...scrutin8431,
      uid: 'VTCGR5L16V1',
      legislature: 16,
      numero: 1,
      date: '2024-03-04',
      title:
        "le projet de loi constitutionnelle relatif à la liberté de recourir à l'interruption volontaire de grossesse.",
      sourceUrl: `${AN}/dyn/16/scrutins/1`,
    };
    const { fetchPage, calls } = fakeFetcher(NOMINAL_PAGES);
    const ctx = await collectContext(congres, { force: true, fetchPage, cacheDir });
    expect(calls).toEqual([]);
    expect(ctx.text).toBeNull();
    expect(ctx.sources[0]).toMatchObject({ url: `${AN}/dyn/16/scrutins/1`, status: 'missing' });
    expect(ctx.warnings[0]).toMatch(/^Vote du Congrès/);
  });

  it('tronque l’exposé des motifs et les articles trop longs, avec avertissement', async () => {
    const paragraph = (i: number): string => `<p>Paragraphe ${i} ${'x'.repeat(990)}.</p>`;
    const longExpose = Array.from({ length: 100 }, (_, i) => paragraph(i)).join('\n');
    const longArticles = `<p class="assnat9ArticleNum">Article unique</p>${Array.from({ length: 50 }, (_, i) => paragraph(i)).join('\n')}`;
    const pages = {
      ...NOMINAL_PAGES,
      [`${AN}/dyn/docs/PIONANR5L17B2107.raw`]: documentHtml({ expose: longExpose, articles: longArticles }),
    };
    const ctx = await collectContext(scrutin8431, { force: true, fetchPage: fakeFetcher(pages).fetchPage, cacheDir });
    expect(ctx.exposeDesMotifs?.length).toBeLessThanOrEqual(EXPOSE_MAX_CHARS);
    expect(ctx.exposeDesMotifs?.length).toBeGreaterThan(EXPOSE_MAX_CHARS - 1100);
    expect(ctx.exposeDesMotifs?.endsWith('.')).toBe(true); // coupe en fin de paragraphe
    expect(ctx.articles?.length).toBeLessThanOrEqual(ARTICLES_MAX_CHARS);
    expect(ctx.articles?.startsWith('Article unique\n')).toBe(true);
    expect(ctx.warnings).toEqual([
      expect.stringMatching(/^Exposé des motifs tronqué à 80.000 caractères \(100.\d{3} caractères à l’origine\)\.$/),
      expect.stringMatching(/^Articles tronqués à 40.000 caractères/),
    ]);
  });

  it('sans exposé des motifs dans le document : articles seuls et avertissement', async () => {
    const html = `<html><body><p>N° 1855</p><p>PROJET DE LOI</p><p>ADOPTÉ PAR LE SÉNAT,</p>
      <p class="assnat9ArticleNum">Article 1er</p><p class="assnatLoiTexte">Le code est ainsi modifié.</p></body></html>`;
    const pages = { ...NOMINAL_PAGES, [`${AN}/dyn/docs/PIONANR5L17B2107.raw`]: html };
    const ctx = await collectContext(scrutin8431, { force: true, fetchPage: fakeFetcher(pages).fetchPage, cacheDir });
    expect(ctx.exposeDesMotifs).toBeNull();
    expect(ctx.articles).toBe('Article 1er\nLe code est ainsi modifié.');
    expect(ctx.warnings).toEqual(['Exposé des motifs introuvable dans le texte déposé.']);
  });
});
