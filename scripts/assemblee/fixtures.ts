/**
 * Fixtures des tests de la collecte de contexte : extraits représentatifs des pages réelles du site de
 * l'AN (structure conservée, contenu abrégé) et le scrutin 8431 qui les relie, partagés par pages.test.ts,
 * document.test.ts et context.test.ts.
 */
import type { Scrutin } from '#data/model/types.ts';

export const AN = 'https://www.assemblee-nationale.fr';

export const scrutin8431: Scrutin = {
  uid: 'VTANR5L17V8431',
  legislature: 17,
  numero: 8431,
  date: '2026-07-21',
  title:
    "l'ensemble de la proposition de loi visant à protéger les mineurs des risques auxquels les expose l'utilisation des réseaux sociaux (texte de la commission mixte paritaire).",
  kind: 'ensemble',
  textType: 'proposition-de-loi',
  voteType: 'SPS',
  solemn: true,
  result: 'adopte',
  dossierRef: 'DLR5L17N53187',
  dossierTitle: 'Protéger les mineurs des risques auxquels les expose l’utilisation des réseaux sociaux',
  totals: { pour: 279, contre: 81, abstention: 66, nonVotants: 2, votants: 426, exprimes: 360 },
  groups: [],
  sourceUrl: `${AN}/dyn/17/scrutins/8431`,
};

/** Page du scrutin : phrase « Scrutin public n°… sur … » et bloc « Voir le dossier législatif ». */
export const scrutinPageHtml = (
  opts: { dossier?: boolean; compteRendu?: boolean; title?: string; numero?: number } = {},
): string => `
<!DOCTYPE html><html lang="fr"><head><title>Analyse du scrutin n°8431 - 17e législature - Assemblée nationale</title></head>
<body><header><a href="/dyn/17/scrutins">Scrutins</a></header><main>
<h1 class="h1 ">Analyse du scrutin n°${opts.numero ?? 8431}</h1>
<p class="h6 _colored">Scrutin public n°${opts.numero ?? 8431} sur ${opts.title ?? 'l&#039;ensemble de la proposition de loi visant à protéger les mineurs des risques auxquels les expose l&#039;utilisation des réseaux sociaux (texte de la commission mixte paritaire).'}</p>
<div class="an-bloc"><span class="_colored-green _bold">L&#039;Assemblée nationale a adopté</span></div>
${
  opts.dossier === false
    ? ''
    : `<div class="an-bloc _style-5 _no-shadow @Tilt _interactive" data-actions="{&quot;blank&quot;:&quot;\\/dyn\\/17\\/dossiers\\/proteger_mineurs_reseaux_sociaux_17e&quot;}">
  <div class="bloc-title "><span class=" ">Voir le dossier législatif</span></div>
  <a class="inner"
           href="/dyn/17/dossiers/proteger_mineurs_reseaux_sociaux_17e"
                              ></a>
</div>`
}
${
  opts.compteRendu === false
    ? ''
    : `<div class="an-bloc _style-5 _no-shadow @Tilt _interactive">
  <div class="bloc-title "><span class=" ">Voir le compte rendu de la séance</span></div>
  <a class="inner" href="/dyn/17/comptes-rendus/seance/CRSANR5L17S2026O1N300"></a>
</div>`
}
</main></body></html>`;

/**
 * Page du dossier : blocs d'actes législatifs, le dépôt initial porte « DepotInitiative » dans data-id.
 * Le lien d'un texte contient son titre et son numéro ; la date de dépôt suit dans un span voisin.
 */
export const dossierPageHtml = `
<!DOCTYPE html><html lang="fr"><head><title>Protéger les mineurs des risques auxquels les expose l’utilisation des réseaux sociaux - Dossiers législatifs - 17e législature - Assemblée nationale</title></head>
<body><header><a href="/dyn/17/dossiers">Dossiers</a></header><main>
<h1 class="h1 _small">Protéger les mineurs des risques auxquels les expose l’utilisation des réseaux sociaux</h1>
<div class="acte-legislatif-bloc _niveau-1 _static   "
     data-id="L17-VD228799DI (DepotInitiative / -DEPOT)" >
  <span>Dépôt à l'Assemblée nationale</span>
  <a href="https://www.assemblee-nationale.fr/dyn/17/textes/l17b2107_proposition-loi"
     class="link"
     data-document-id="PIONANR5L17B2107"
     title="Accéder à la page du document"
  ><span>Proposition de loi visant à protéger les mineurs des risques auxquels les expose l’utilisation des réseaux sociaux, n°&nbsp;2107</span></a><span>, déposée le mardi 18 novembre 2025.</span>
  <a href="https://www.assemblee-nationale.fr/dyn/17/textes/l17b2107_avis-conseil-etat" class="link" data-document-id="AVCEANR5L17B2107"> Avis du Conseil d'Etat </a>
</div>
<div class="acte-legislatif-bloc _niveau-1 _static   " data-id="L17-AN1-53187 (Etape / AN1)" >
  <a href="https://www.assemblee-nationale.fr/dyn/17/textes/l17t0217_texte-adopte-seance" class="button"> Texte adopté ✅ </a>
  <a href="https://www.assemblee-nationale.fr/dyn/17/textes/l17b2107_proposition-loi" class="link" data-document-id="PIONANR5L17B2107"><span>Proposition de loi visant à protéger les mineurs des risques auxquels les expose l’utilisation des réseaux sociaux, n°&nbsp;2107</span></a><span>, déposée le mardi 18 novembre 2025.</span>
  <div class="acte-legislatif-bloc _niveau-2 @TogglableBox _simple " data-id="L17-AN1-COM-53187 (Etape / -COM)" >
    <a href="https://www.assemblee-nationale.fr/dyn/17/textes/l17b2341_texte-adopte-commission" class="link" data-document-id="PIONANR5L17BTC2341"> Texte de la commission </a>
  </div>
</div>
<div class="acte-legislatif-bloc _niveau-1 _static  _senat " data-id="L17-SN1-53187 (Etape / SN1)" >
  <a href="https://www.senat.fr/leg/ppl25-304.html" class="link" data-document-id="PIONSNR5S479B0304"> Proposition de loi transmise au Sénat </a>
  <a href="https://www.assemblee-nationale.fr/dyn/17/textes/l17b2610_proposition-loi" class="link" data-document-id="PIONANR5L17B2610"><span>Proposition de loi, adoptée par le Sénat, visant à protéger les mineurs, n°&nbsp;2610</span></a><span>, déposée le mardi 27 janvier 2026.</span>
</div>
</main></body></html>`;

/** Page du texte : le document est chargé dans une iframe. */
export const textPageHtml = `
<!DOCTYPE html><html lang="fr"><head><title>Proposition de loi, n° 2107 - 17e législature - Assemblée nationale</title></head>
<body><main>
<h1 class="h1 ">Proposition de loi, n° 2107</h1>
<iframe id="docOpaqueIFrame"
        src="/dyn/docs/PIONANR5L17B2107.raw"
        data-useEmbedToc="false"
        style="border:0; display:block; margin: 0 auto; width: 800px; height: 1000px"></iframe>
<a class="inner" href="/dyn/17/textes/l17b2107_proposition-loi.pdf" title="Accéder au document au format PDF"></a>
</main></body></html>`;

/** Document : export Word, page de garde, exposé des motifs puis dispositif. */
export const documentHtml = (opts: { expose?: string; articles?: string } = {}): string => `
<!DOCTYPE html><html lang="fr-FR"><head><title>PIONANR5L17B2107</title><style>p { margin:0pt }</style></head>
<body>
<div class="assnatSection1">
  <div style="; clear:both"><p style="text-align:center; font-size:11pt">– 1 –</p></div>
  <p style="text-align:center"><img src="data:image/png;base64,iVBORw0KGgo="></p>
  <p style="text-align:center; font-size:28pt">N° 2107</p>
  <p style="text-align:center"><span style="font-weight:bold">_____</span></p>
  <p style="text-align:center; font-size:28pt">ASSEMBLÉE NATIONALE</p>
  <p style="margin-top:60pt; text-align:center; font-size:28pt"><span style="font-weight:bold">PROPOSITION DE LOI</span></p>
  <p style="text-align:center"><span style="font-style:italic">visant à </span><span style="font-weight:bold">protéger</span><span style="font-style:italic"> les mineurs,</span></p>
  <p style="text-align:center; font-size:13pt">présentée par</p>
  <p style="font-size:13pt">Mme Laure MILLER, M. Gabriel ATTAL,</p>
  <div style="; clear:both"><p> </p></div>
</div>
<br style="page-break-before:always; clear:both; mso-break-type:section-break">
<div class="assnatSection2">
  <div style="; clear:both"><p style="text-align:center; font-size:11pt">– 1 –</p></div>
  <p class="assnat4titreintit" style="margin-top:6pt"><span style="font-family:'Times New Roman'; font-weight:normal">EXPOSÉ DES MOTIFS</span></p>
  <p style="margin-bottom:12pt; text-indent:42.55pt">M<span style="font-variant:small-caps">esdames</span>, M<span style="font-variant:small-caps">essieurs</span>,</p>
  ${
    opts.expose ??
    `<p style="margin-bottom:12pt; text-indent:42.55pt">Le 11 septembre 2025 a été rendu public le rapport de la commission d’enquête<span style="font-size:9.33pt; vertical-align:super">(</span><a id="_ftnref1"></a><a href="#_ftn1" style="text-decoration:none"><span style="font-size:9.33pt; vertical-align:super">[1]</span></a><span style="font-size:9.33pt; vertical-align:super">)</span>.</p>
  <p style="margin-bottom:12pt; text-indent:42.55pt"><span style="font-weight:bold">La nécessité d’une régulation</span></p>
  <p style="margin-bottom:12pt; text-indent:42.55pt">Il s’agit par cet article de mettre en œuvre la recommandation n°&nbsp;43.</p>`
  }
  <div style="; clear:both"><p> </p></div>
</div>
<br style="page-break-before:always; clear:both; mso-break-type:section-break">
<div class="assnatSection3">
  <div style="; clear:both"><p style="text-align:center; font-size:11pt">– 1 –</p></div>
  <p class="assnat4titreintit" style="margin-top:12pt; margin-bottom:30pt"><span style="font-family:'Times New Roman'; font-weight:normal">proposition de loi</span></p>
  ${
    opts.articles ??
    `<p class="assnat9ArticleNum">Article 1<span style="font-size:9.33pt; vertical-align:super">er</span> </p>
  <p class="assnatLoiTexte"><span style="height:0pt; display:block; position:absolute; z-index:0"><img src="data:image/png;base64,iVBORw0KGgo="></span>Le code pénal est ainsi modifié :</p>
  <p class="assnat6SectionNum0">Section 1</p>
  <p class="assnatLoiTexte">« Art. L. 123‑1. – Les orientations pluriannuelles font l’objet d’un débat. »</p>
  <p class="assnat9ArticleNum">Article 2</p>
  <p class="assnatLoiTexte">Dans un délai de trois ans, le Gouvernement remet au Parlement un rapport.</p>
  <p class="assnatLoiTexte"> </p>`
  }
  <div style="; clear:both"><p> </p></div>
</div>
<hr style="width:33%; height:1px; text-align:left">
<div id="_ftn1"><p class="assnatFootnoteText" style="text-indent:0pt"><a href="#_ftnref1"><span class="assnatFootnoteReference">[1]</span></a> Rapport n° 1234.</p></div>
<script src="/assets/build/document_iframe.js"></script>
</body></html>`;

/** Chaîne nominale complète du scrutin 8431 : scrutin → dossier → texte → document. */
export const NOMINAL_PAGES: Record<string, string> = {
  [`${AN}/dyn/17/scrutins/8431`]: scrutinPageHtml(),
  [`${AN}/dyn/17/dossiers/proteger_mineurs_reseaux_sociaux_17e`]: dossierPageHtml,
  [`${AN}/dyn/17/textes/l17b2107_proposition-loi`]: textPageHtml,
  [`${AN}/dyn/docs/PIONANR5L17B2107.raw`]: documentHtml(),
};
