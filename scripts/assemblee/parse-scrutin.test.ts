import { describe, expect, it } from 'vitest';
import { classifyKind, classifyTextType, parseScrutin } from '#scripts/assemblee/parse-scrutin.ts';
import type { RawScrutinFile } from '#scripts/assemblee/raw-types.ts';

describe('classifyKind', () => {
  it('reconnaît les natures de vote depuis le titre officiel', () => {
    expect(classifyKind("l'ensemble de la proposition de loi visant à…")).toBe('ensemble');
    expect(classifyKind('l’ensemble du projet de loi de finances')).toBe('ensemble');
    expect(classifyKind("l'amendement n° 89 de Mme Runel")).toBe('amendement');
    expect(classifyKind('les amendements identiques n° 12 et 40')).toBe('amendement');
    expect(classifyKind('le sous-amendement n° 3')).toBe('sous-amendement');
    expect(classifyKind("l'article 8 du projet de loi")).toBe('article');
    expect(classifyKind('la motion de rejet préalable de M. X')).toBe('motion');
    expect(classifyKind('la proposition de résolution visant à reconnaître…')).toBe('ensemble');
    expect(classifyKind('le projet de loi constitutionnelle relatif à la liberté de recourir à l’IVG')).toBe(
      'ensemble',
    );
    expect(classifyKind('la demande de suspension de séance')).toBe('procedure');
    expect(classifyKind('la déclaration du Gouvernement')).toBe('autre');
  });
});

describe('classifyTextType', () => {
  it('distingue projet, proposition de loi et résolution', () => {
    expect(classifyTextType("l'ensemble du projet de loi pour contrôler l'immigration")).toBe('projet-de-loi');
    expect(classifyTextType("l'ensemble de la proposition de loi visant à protéger les mineurs")).toBe(
      'proposition-de-loi',
    );
    expect(classifyTextType("l'ensemble de la proposition de résolution européenne")).toBe('proposition-de-resolution');
    expect(classifyTextType("la déclaration du Gouvernement relative à l'Ukraine")).toBe('declaration-du-gouvernement');
    expect(classifyTextType("l'amendement n° 1")).toBe('autre');
  });
});

const raw: RawScrutinFile = {
  scrutin: {
    uid: 'VTANR5L17V8431',
    numero: '8431',
    legislature: '17',
    dateScrutin: '2026-07-21',
    titre: "l'ensemble de la proposition de loi visant à protéger les   mineurs (texte de la CMP).",
    typeVote: { codeTypeVote: 'SPS', libelleTypeVote: 'scrutin public solennel' },
    sort: { code: 'adopté', libelle: "l'Assemblée nationale a adopté" },
    objet: { libelle: 'x', dossierLegislatif: { dossierRef: 'DLR5L17N53187', libelle: 'Protéger les mineurs' } },
    syntheseVote: {
      nombreVotants: '426',
      suffragesExprimes: '360',
      decompte: { pour: '279', contre: '81', abstentions: '66', nonVotants: '2', nonVotantsVolontaires: '0' },
    },
    ventilationVotes: {
      organe: {
        groupes: {
          groupe: [
            {
              organeRef: 'PO845401',
              nombreMembresGroupe: '122',
              vote: {
                positionMajoritaire: 'contre',
                decompteVoix: { pour: '0', contre: '2', abstentions: '14', nonVotants: '1' },
              },
            },
            {
              organeRef: 'PO845407',
              nombreMembresGroupe: '91',
              vote: {
                positionMajoritaire: 'pour',
                decompteVoix: { pour: '83', contre: null, abstentions: undefined, nonVotants: '1' },
              },
            },
          ],
        },
      },
    },
  },
};

describe('parseScrutin', () => {
  const scrutin = parseScrutin(raw, 17);

  it('normalise les champs principaux', () => {
    expect(scrutin.uid).toBe('VTANR5L17V8431');
    expect(scrutin.numero).toBe(8431);
    expect(scrutin.title).toBe("l'ensemble de la proposition de loi visant à protéger les mineurs (texte de la CMP).");
    expect(scrutin.kind).toBe('ensemble');
    expect(scrutin.textType).toBe('proposition-de-loi');
    expect(scrutin.solemn).toBe(true);
    expect(scrutin.result).toBe('adopte');
    expect(scrutin.dossierRef).toBe('DLR5L17N53187');
    expect(scrutin.dossierTitle).toBe('Protéger les mineurs');
    expect(scrutin.sourceUrl).toBe('https://www.assemblee-nationale.fr/dyn/17/scrutins/8431');
  });

  it('convertit les décomptes en nombres, les champs absents valant 0', () => {
    expect(scrutin.totals).toEqual({
      pour: 279,
      contre: 81,
      abstention: 66,
      nonVotants: 2,
      votants: 426,
      exprimes: 360,
    });
    expect(scrutin.groups[1]).toEqual({
      groupRef: 'PO845407',
      members: 91,
      pour: 83,
      contre: 0,
      abstention: 0,
      nonVotants: 1,
      officialMajority: 'pour',
    });
  });

  it('accepte un groupe unique sérialisé comme objet et classe les motions de censure', () => {
    const single: RawScrutinFile = {
      scrutin: {
        ...raw.scrutin,
        titre: 'la motion de censure déposée par…',
        typeVote: { codeTypeVote: 'MOC' },
        sort: { code: 'rejeté' },
        objet: { dossierLegislatif: null },
        ventilationVotes: {
          organe: { groupes: { groupe: { organeRef: 'PO1', nombreMembresGroupe: '10', vote: null } } },
        },
      },
    };
    const parsed = parseScrutin(single, 16);
    expect(parsed.kind).toBe('motion');
    expect(parsed.solemn).toBe(false);
    expect(parsed.result).toBe('rejete');
    expect(parsed.dossierRef).toBeNull();
    expect(parsed.groups).toEqual([
      { groupRef: 'PO1', members: 10, pour: 0, contre: 0, abstention: 0, nonVotants: 0, officialMajority: null },
    ]);
    expect(parsed.sourceUrl).toBe('https://www.assemblee-nationale.fr/dyn/16/scrutins/8431');
  });
});
