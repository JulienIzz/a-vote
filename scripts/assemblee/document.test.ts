import { describe, expect, it } from 'vitest';
import { extractDocument } from '#scripts/assemblee/document.ts';
import { documentHtml } from '#scripts/assemblee/fixtures.ts';

describe('extractDocument', () => {
  it('sépare l’exposé des motifs des articles, sans page de garde, images ni notes', () => {
    const { expose, articles } = extractDocument(documentHtml());
    expect(expose).toBe(
      [
        'Mesdames, Messieurs,',
        'Le 11 septembre 2025 a été rendu public le rapport de la commission d’enquête([1]).',
        'La nécessité d’une régulation',
        'Il s’agit par cet article de mettre en œuvre la recommandation n° 43.',
      ].join('\n'),
    );
    expect(articles).toBe(
      [
        'Article 1er',
        'Le code pénal est ainsi modifié :',
        'Section 1',
        '« Art. L. 123-1. – Les orientations pluriannuelles font l’objet d’un débat. »',
        'Article 2',
        'Dans un délai de trois ans, le Gouvernement remet au Parlement un rapport.',
      ].join('\n'),
    );
  });

  it('extrait les articles d’un texte transmis sans exposé des motifs', () => {
    const html = `<html><body><div class="assnatSection1">
      <p>N° 1855</p><p>ASSEMBLÉE NATIONALE</p><p>PROJET DE LOI</p><p>ADOPTÉ PAR LE SÉNAT,</p>
      <p>pour contrôler l’immigration, améliorer l’intégration,</p>
      <p>Le Sénat a adopté, en première lecture, le projet de loi dont la teneur suit :</p>
      <p>– 1 –</p>
      <p class="assnat4TitreNum">TITRE Ier A</p><p class="assnat4TitreIntit">Maîtriser les voies d’accès au séjour</p>
      <p class="assnat9ArticleNum">Article 1er A (nouveau)</p>
      <p class="assnatLoiTexte">L’article L. 123-1 du code est ainsi rédigé :</p>
    </div></body></html>`;
    const { expose, articles } = extractDocument(html);
    expect(expose).toBeNull();
    expect(articles).toBe(
      'TITRE Ier A\nMaîtriser les voies d’accès au séjour\nArticle 1er A (nouveau)\nL’article L. 123-1 du code est ainsi rédigé :',
    );
  });

  it('gère une proposition de résolution à article unique', () => {
    const html = `<html><body>
      <p>PROPOSITION DE RÉSOLUTION</p><p>visant à abroger la réforme des retraites</p>
      <p class="assnat4titreintit">EXPOSÉ DES MOTIFS</p><p>Mesdames, Messieurs,</p><p>Il y a deux ans était promulguée la loi.</p>
      <p>– 1 –</p>
      <p class="assnat4titreintit">proposition de RÉSOLUTION</p>
      <p class="assnat9ArticleNum">Article unique</p><p>Vu l’article 34-1 de la Constitution,</p><p>Considérant que la loi a été adoptée sans vote,</p>
    </body></html>`;
    const { expose, articles } = extractDocument(html);
    expect(expose).toBe('Mesdames, Messieurs,\nIl y a deux ans était promulguée la loi.');
    expect(articles).toBe(
      'Article unique\nVu l’article 34-1 de la Constitution,\nConsidérant que la loi a été adoptée sans vote,',
    );
  });
});
