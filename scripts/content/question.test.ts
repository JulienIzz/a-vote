import { describe, expect, it } from 'vitest';
import { parseFiche } from '#scripts/content/fiche.ts';
import { families, filled, scrutin, skeleton } from '#scripts/content/fixtures.ts';
import { ficheToQuestion, markdownLinks } from '#scripts/content/question.ts';

const base = { scrutin, families, knownThemes: new Set(['numerique']), drafts: true };

describe('ficheToQuestion', () => {
  it('convertit une fiche rédigée en question avec votes, sources et URLs', () => {
    const result = ficheToQuestion({ ...base, parsed: parseFiche(filled) });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const q = result.question;
    expect(q.question).toBe('Faut-il interdire les réseaux sociaux aux moins de 15 ans ?');
    expect(q.sens).toBe('pour');
    expect(q.statut).toBe('brouillon');
    expect(q.summary).toBe('Le texte interdit l’inscription des moins de 15 ans sur les réseaux sociaux.');
    expect(q.measures).toEqual([
      'Interdiction d’inscription avant 15 ans.',
      'Vérification de l’âge par les plateformes.',
    ]);
    expect(q.pour).toEqual(['Selon les auteurs, protéger la santé mentale des adolescents.']);
    expect(q.contre).toEqual(['Pour les députés LFI, une mesure inefficace.']);
    expect(q.themes).toEqual(['numerique']);
    expect(q.result).toBe('adopte');
    expect(q.urls.dossier).toBe('https://www.assemblee-nationale.fr/dyn/17/dossiers/x');
    expect(q.sources.map((s) => s.url)).toContain('https://www.assemblee-nationale.fr/dyn/docs/PIONANR5L17B2107.raw');
    expect(q.votes).toEqual([
      { familyId: 'lfi', pour: 0, contre: 63, abstention: 0, members: 71 },
      { familyId: 'rn', pour: 0, contre: 2, abstention: 14, members: 122 },
    ]);
  });
  it('écarte les gabarits, les brouillons sans --drafts, les sens invalides et les scrutins inconnus', () => {
    expect(ficheToQuestion({ ...base, parsed: parseFiche(skeleton) })).toMatchObject({
      ok: false,
      reason: 'incomplete',
    });
    expect(ficheToQuestion({ ...base, drafts: false, parsed: parseFiche(filled) })).toMatchObject({
      ok: false,
      reason: 'brouillon',
    });
    expect(
      ficheToQuestion({ ...base, parsed: parseFiche(filled.replace('sens: "pour"', 'sens: "oui"')) }),
    ).toMatchObject({ ok: false, reason: 'sens' });
    expect(ficheToQuestion({ ...base, scrutin: undefined, parsed: parseFiche(filled) })).toMatchObject({
      ok: false,
      reason: 'inconnue',
    });
  });
  it('ignore les thèmes inconnus', () => {
    const result = ficheToQuestion({
      ...base,
      parsed: parseFiche(filled.replace('themes: ["numerique"]', 'themes: ["numerique", "x"]')),
    });
    expect(result.ok && result.question.themes).toEqual(['numerique']);
  });
});

describe('markdownLinks', () => {
  it('fusionne les liens ajoutés dans « Pour aller plus loin » avec les sources de l’en-tête', () => {
    expect(
      markdownLinks(
        '- [Le texte adopté](https://www.assemblee-nationale.fr/dyn/17/textes/l17t0339_texte-adopte-seance)\n- pas un lien',
      ),
    ).toEqual([
      {
        label: 'Le texte adopté',
        url: 'https://www.assemblee-nationale.fr/dyn/17/textes/l17t0339_texte-adopte-seance',
      },
    ]);
    const md = filled.replace(
      '## À vérifier avant publication',
      '- [La décision du Conseil constitutionnel](https://www.conseil-constitutionnel.fr/decision/2026/2026911DC.htm)\n\n## À vérifier avant publication',
    );
    const result = ficheToQuestion({ ...base, parsed: parseFiche(md) });
    expect(result.ok && result.question.sources.map((s) => s.label)).toContain(
      'La décision du Conseil constitutionnel',
    );
    expect(result.ok && result.question.sources.filter((s) => s.url.endsWith('/scrutins/8431'))).toHaveLength(1);
  });
});
