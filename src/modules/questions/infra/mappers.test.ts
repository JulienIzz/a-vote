import { describe, expect, it } from 'vitest';
import { rawQuestion } from '#src/modules/questions/infra/fixtures.ts';
import { toQuestion, toQuestionDetail } from '#src/modules/questions/infra/mappers.ts';
import { createQuestionRepository } from '#src/modules/questions/infra/repository.ts';

describe('toQuestion', () => {
  it('mappe l’index brut vers le domaine sans perdre d’information utile', () => {
    const q = toQuestion(rawQuestion);
    expect(q.id).toBe('VTANR5L17V8431');
    expect(q.text).toBe('Faut-il interdire les réseaux sociaux aux moins de 15 ans ?');
    expect(q.sens).toBe('pour');
    expect(q.status).toBe('relu');
    expect(q.scrutin).toEqual({
      uid: 'VTANR5L17V8431',
      legislature: 17,
      date: '2026-07-21',
      officialTitle: rawQuestion.officialTitle,
      result: 'adopte',
      totals: { pour: 279, contre: 81, abstention: 66, votants: 426 },
      url: 'https://www.assemblee-nationale.fr/dyn/17/scrutins/8431',
    });
  });
});

describe('toQuestionDetail', () => {
  it('mappe le texte long de la fiche', () => {
    const d = toQuestionDetail(rawQuestion);
    expect(d.argumentsFor).toEqual(['Selon les auteurs, protéger la santé mentale des adolescents.']);
    expect(d.argumentsAgainst).toHaveLength(1);
    expect(d.sources[1]?.label).toBe('Le dossier législatif');
  });
  it('copie les tableaux : modifier le domaine ne touche pas le brut', () => {
    const d = toQuestionDetail(rawQuestion);
    d.measures.push('x');
    expect(rawQuestion.measures).toHaveLength(2);
  });
});

describe('createQuestionRepository', () => {
  const themes = [{ id: 'numerique', label: 'Numérique' }];

  it('retrouve une question par identifiant et liste les thèmes', () => {
    const repo = createQuestionRepository([rawQuestion], themes, async () => rawQuestion);
    expect(repo.byId('VTANR5L17V8431')?.text).toContain('réseaux sociaux');
    expect(repo.byId('inconnu')).toBeUndefined();
    expect(repo.all()).toHaveLength(1);
    expect(repo.themes()).toEqual([{ id: 'numerique', label: 'Numérique' }]);
  });

  it('charge le détail une seule fois, et rien pour une question inconnue', async () => {
    let loads = 0;
    const repo = createQuestionRepository([rawQuestion], themes, async () => {
      loads += 1;
      return rawQuestion;
    });
    const [a, b] = await Promise.all([repo.detail('VTANR5L17V8431'), repo.detail('VTANR5L17V8431')]);
    expect(a?.measures).toHaveLength(2);
    expect(b).toBe(a);
    expect(await repo.detail('inconnu')).toBeUndefined();
    expect(loads).toBe(1);
  });

  it('réessaie après un échec de chargement', async () => {
    let fail = true;
    const repo = createQuestionRepository([rawQuestion], themes, async () => {
      if (fail) throw new Error('hors ligne');
      return rawQuestion;
    });
    await expect(repo.detail('VTANR5L17V8431')).rejects.toThrow('hors ligne');
    fail = false;
    expect((await repo.detail('VTANR5L17V8431'))?.context).toBe(rawQuestion.context);
  });
});
