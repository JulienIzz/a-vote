import { describe, expect, it } from 'vitest';
import { AN, dossierPageHtml, scrutinPageHtml, textPageHtml } from '#scripts/assemblee/fixtures.ts';
import {
  chooseDepositedText,
  chooseDossier,
  parseCompteRenduDossiers,
  parseDossierPage,
  parseScrutinPage,
  parseTextPage,
} from '#scripts/assemblee/pages.ts';

describe('parseScrutinPage', () => {
  it('lit le numéro, l’objet du vote et les liens dossier / compte rendu', () => {
    const page = parseScrutinPage(scrutinPageHtml(), 17);
    expect(page.numero).toBe(8431);
    expect(page.title).toMatch(/^l'ensemble de la proposition de loi visant à protéger les mineurs/);
    expect(page.dossierUrl).toBe(`${AN}/dyn/17/dossiers/proteger_mineurs_reseaux_sociaux_17e`);
    expect(page.compteRenduUrl).toBe(`${AN}/dyn/17/comptes-rendus/seance/CRSANR5L17S2026O1N300`);
  });

  it('retourne null sans lien vers le dossier', () => {
    const page = parseScrutinPage(scrutinPageHtml({ dossier: false }), 17);
    expect(page.dossierUrl).toBeNull();
    expect(page.compteRenduUrl).not.toBeNull();
  });
});

describe('parseDossierPage / chooseDepositedText', () => {
  it('liste les textes initiaux de l’AN et repère le dépôt initial', () => {
    const dossier = parseDossierPage(dossierPageHtml);
    expect(dossier.title).toBe(
      'Protéger les mineurs des risques auxquels les expose l’utilisation des réseaux sociaux',
    );
    expect(dossier.texts.map((t) => t.number)).toEqual(['2107', '2610']);
    const first = dossier.texts[0];
    expect(first).toMatchObject({
      url: `${AN}/dyn/17/textes/l17b2107_proposition-loi`,
      title:
        'Proposition de loi visant à protéger les mineurs des risques auxquels les expose l’utilisation des réseaux sociaux',
      kind: 'proposition-de-loi',
      deposit: true,
      documentId: 'PIONANR5L17B2107',
    });
    expect(dossier.texts[1]?.deposit).toBe(false);
    expect(chooseDepositedText(dossier.texts)?.number).toBe('2107');
  });

  it('se rabat sur le texte transmis quand le dépôt initial est au Sénat', () => {
    const html = `<html><body>
      <div class="acte-legislatif-bloc _niveau-1 _static _senat" data-id="L16-VD211511DI (DepotInitiative / -DEPOT)">
        <a href="https://www.senat.fr/leg/pjl22-304.html" class="link" data-document-id="PRJLSNR5S399B0304">Projet de loi (Sénat)</a>
      </div>
      <div class="acte-legislatif-bloc _niveau-1 _static" data-id="L16-AN1-47118 (Etape / AN1)">
        <a href="https://www.assemblee-nationale.fr/dyn/16/textes/l16t0213_texte-adopte-seance">Texte adopté</a>
        <a href="https://www.assemblee-nationale.fr/dyn/16/textes/l16b1855_projet-loi" class="link" data-document-id="PRJLANR5L16B1855">Projet de loi, adopté par le Sénat, pour contrôler l’immigration, n° 1855 , déposé le mardi 14 novembre 2023.</a>
      </div></body></html>`;
    const chosen = chooseDepositedText(parseDossierPage(html).texts);
    expect(chosen).toMatchObject({ number: '1855', kind: 'projet-de-loi', deposit: false });
    expect(chosen?.title).toBe('Projet de loi, adopté par le Sénat, pour contrôler l’immigration');
  });
});

describe('parseCompteRenduDossiers / chooseDossier', () => {
  const crHtml = `<html><body><div id="dosLegListeTipsy" class="_no-display"><ul class="simple-tree-list">
    <li><a href="/dyn/17/dossiers/DLR5L17N51115" target="_blank"><span>Proposition de loi expérimentant l’encadrement des loyers dans les outre-mer</span><span class="inner">(Ouverture dans un nouvel onglet)</span></a></li>
    <li><a href="/dyn/17/dossiers/abroger_reforme_retraites17" target="_blank"><span>Abroger la loi n° 2023-270 du 14 avril 2023 de financement rectificative de la sécurité sociale pour 2023 dite réforme des retraites</span><span class="inner">(Ouverture dans un nouvel onglet)</span></a></li>
  </ul></div></body></html>`;

  it('retient le dossier dont le titre recouvre celui du scrutin', () => {
    const links = parseCompteRenduDossiers(crHtml, 17);
    expect(links).toHaveLength(2);
    expect(links[0]?.title).toBe('Proposition de loi expérimentant l’encadrement des loyers dans les outre-mer');
    const chosen = chooseDossier(
      links,
      'la proposition de résolution visant à abroger la loi n° 2023-270 du 14 avril 2023 de financement rectificative de la sécurité sociale pour 2023 dite réforme des retraites.',
    );
    expect(chosen?.url).toBe(`${AN}/dyn/17/dossiers/abroger_reforme_retraites17`);
    expect(chooseDossier(links, "l'ensemble du projet de loi de finances pour 2026.")).toBeNull();
  });
});

describe('parseTextPage', () => {
  it('trouve le document de l’iframe', () => {
    expect(parseTextPage(textPageHtml)).toEqual({
      documentUrl: `${AN}/dyn/docs/PIONANR5L17B2107.raw`,
      title: 'Proposition de loi, n° 2107',
    });
  });
});
