import { describe, expect, it } from 'vitest';
import { type Candidate, dedupeReadings, readingKey } from '#scripts/content/ranking.ts';

describe('readingKey', () => {
  it('retire la mention de lecture et normalise le titre', () => {
    expect(readingKey("l'ensemble du projet de loi pour le plein emploi (première lecture).")).toEqual({
      key: 'ensemble projet loi plein emploi',
      label: 'premiere lecture',
    });
    expect(
      readingKey("l'ensemble du projet de loi pour le plein emploi (texte de la commission mixte paritaire).").key,
    ).toBe('ensemble projet loi plein emploi');
    expect(readingKey("l'ensemble du projet de loi X (nouvelle lecture)").label).toBe('nouvelle lecture');
    expect(readingKey("l'ensemble du projet de loi X (texte de la commission paritaire).").key).toBe(
      'ensemble projet loi x',
    );
  });
  it('ignore les mots-outils, qui varient entre lectures dans les titres officiels', () => {
    expect(
      readingKey(
        "l'ensemble du projet de loi portant mesures d'urgence relatives au fonctionnement du marché de travail (première lecture).",
      ).key,
    ).toBe(
      readingKey(
        "l'ensemble du projet de loi portant mesures d'urgence relatives au fonctionnement du marché du travail (texte de la commission mixte paritaire).",
      ).key,
    );
  });
  it('garde les mots significatifs d’un titre sans mention de lecture', () => {
    expect(readingKey("l'ensemble de la proposition de résolution (n° 12) visant à…")).toEqual({
      key: 'ensemble proposition resolution n 12 visant',
      label: null,
    });
  });
});

const candidate = (
  uid: string,
  legislature: 16 | 17,
  title: string,
  score: number,
  date = '2024-01-01',
  dossierRef: string | null = null,
): Candidate => ({
  uid,
  legislature,
  numero: 1,
  date,
  title,
  dossierRef,
  dossierTitle: null,
  kind: 'ensemble',
  textType: 'projet-de-loi',
  solemn: false,
  result: 'adopte',
  votants: 300,
  sourceUrl: `https://example.test/${uid}`,
  themes: [],
  keywords: [],
  discriminance: 0.5,
  participation: 0.5,
  score,
  families: [],
  reading: readingKey(title).label,
  otherReadings: [],
});

describe('dedupeReadings', () => {
  it('garde la première entrée de chaque texte, toutes législatures confondues, et rattache les autres lectures', () => {
    const sorted = [
      candidate('A', 16, 'l’ensemble du projet de loi X (texte de la commission mixte paritaire).', 0.9, '2024-03-01'),
      candidate('B', 16, 'l’ensemble du projet de loi Y (première lecture).', 0.8),
      candidate('C', 16, 'l’ensemble du projet de loi X (première lecture).', 0.7, '2024-01-15'),
      candidate('D', 17, 'l’ensemble du projet de loi X (première lecture).', 0.6),
    ];
    const result = dedupeReadings(sorted);
    expect(result.map((c) => c.uid)).toEqual(['A', 'B']);
    expect(result[0]?.otherReadings).toEqual([
      {
        uid: 'C',
        legislature: 16,
        date: '2024-01-15',
        label: 'premiere lecture',
        sourceUrl: 'https://example.test/C',
        score: 0.7,
      },
      {
        uid: 'D',
        legislature: 17,
        date: '2024-01-01',
        label: 'premiere lecture',
        sourceUrl: 'https://example.test/D',
        score: 0.6,
      },
    ]);
    expect(result[1]?.otherReadings).toEqual([]);
    // les entrées d'origine ne sont pas modifiées
    expect(sorted[0]?.otherReadings).toEqual([]);
  });
  it('regroupe aussi par dossier, quand le titre officiel change d’une lecture à l’autre', () => {
    const sorted = [
      candidate(
        'A',
        17,
        'l’ensemble de la proposition de loi relative au renforcement de la sûreté dans les transports (texte de la commission mixte paritaire).',
        0.9,
        '2025-03-18',
        'DLR1',
      ),
      candidate(
        'B',
        17,
        'l’ensemble de la proposition de loi relative à la sûreté dans les transports (première lecture).',
        0.8,
        '2025-02-11',
        'DLR1',
      ),
      candidate('C', 17, 'l’ensemble de la proposition de loi Y (première lecture).', 0.7, '2025-01-01', 'DLR2'),
      candidate('D', 17, 'l’ensemble de la proposition de loi Y (texte de la commission mixte paritaire).', 0.6),
    ];
    const result = dedupeReadings(sorted);
    expect(result.map((c) => c.uid)).toEqual(['A', 'C']);
    expect(result[0]?.otherReadings.map((r) => r.uid)).toEqual(['B']);
    expect(result[1]?.otherReadings.map((r) => r.uid)).toEqual(['D']);
  });
});
