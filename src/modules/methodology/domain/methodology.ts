/** La transparence de l'app : la méthode de calcul et la provenance des données, telles qu'affichées. */

export interface Methodology {
  title: string;
  /** Le texte de data/content/METHODE.md. */
  markdown: string;
}

export interface Dataset {
  name: string;
  url: string;
  licence: string;
  bytes: number | null;
  /** Date ISO de l'archive, si connue. */
  modifiedAt: string | null;
}

export interface Provenance {
  /** Date ISO du dernier import de l'open data, null si inconnue. */
  importedAt: string | null;
  datasets: Dataset[];
  website: string;
  repository: string | null;
}

/** « 26,9 Mo », « 512 ko », ou null si la taille est inconnue. */
export function formatBytes(bytes: number | null): string | null {
  if (bytes === null || bytes < 0) return null;
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1_048_576) return `${Math.round(bytes / 1024)} ko`;
  return `${(bytes / 1_048_576).toFixed(1).replace('.', ',')} Mo`;
}

/** « 25 octobre 2026 », ou null si la date est inconnue ou illisible. */
export function formatDate(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    date,
  );
}

/** Une ligne de description : « Scrutins de la XVIIe législature, 26,9 Mo, archive du 25 octobre 2026 ». */
export function describeDataset(dataset: Dataset): string {
  const parts = [dataset.name];
  const size = formatBytes(dataset.bytes);
  if (size) parts.push(size);
  const date = formatDate(dataset.modifiedAt);
  if (date) parts.push(`archive du ${date}`);
  return parts.join(', ');
}

export interface MethodSection {
  /** Ancre stable, tirée du titre : « les-donnees ». */
  id: string;
  title: string;
  /** Le Markdown de la section, sans son titre. */
  body: string;
}

/** Ancre lisible : minuscules, sans accents ni ponctuation. */
export function slugify(title: string): string {
  return title
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/** Découpe la méthode en chapeau puis sections de niveau 2, pour un sommaire. Le titre principal est retiré. */
export function splitSections(markdown: string): { intro: string; sections: MethodSection[] } {
  const withoutTitle = markdown.replace(/^# .+\n?/m, '');
  const [intro = '', ...rest] = withoutTitle.split(/^## /m);
  const sections = rest.map((chunk) => {
    const [titleLine = '', ...body] = chunk.split('\n');
    const title = titleLine.trim();
    return { id: slugify(title), title, body: body.join('\n').trim() };
  });
  return { intro: intro.trim(), sections };
}
