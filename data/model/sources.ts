/** Un lien vers une source, tel qu'affiché dans l'app. */
export interface SourceLink {
  label: string;
  url: string;
}

/** Libellé lisible d'une URL de source, déduit de sa forme. */
export function labelForSource(url: string): string {
  if (url.includes('data.assemblee-nationale.fr')) return "Open data de l'Assemblée nationale (archive des scrutins)";
  if (/\/dyn\/docs\//.test(url)) return 'Document brut du texte (exposé des motifs et articles)';
  if (/\/scrutins\//.test(url)) return 'Le scrutin sur assemblee-nationale.fr';
  if (/\/dossiers\//.test(url)) return 'Le dossier législatif';
  if (/\/textes\//.test(url)) return 'Le texte déposé';
  if (/\/comptes-rendus\//.test(url)) return 'Le compte rendu de la séance';
  if (url.includes('senat.fr')) return 'Sur le site du Sénat';
  if (url.includes('vie-publique.fr')) return 'La fiche vie-publique.fr';
  if (url.includes('conseil-constitutionnel.fr')) return 'La décision du Conseil constitutionnel';
  return 'Source';
}

/** Transforme une liste d'URL en liens libellés, sans doublon, dans l'ordre donné. */
export function toSourceLinks(urls: readonly string[]): SourceLink[] {
  const seen = new Set<string>();
  const links: SourceLink[] = [];
  for (const url of urls) {
    const trimmed = url.trim();
    if (trimmed === '' || seen.has(trimmed)) continue;
    seen.add(trimmed);
    links.push({ label: labelForSource(trimmed), url: trimmed });
  }
  return links;
}
