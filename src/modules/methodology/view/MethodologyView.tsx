import { useEffect } from 'react';
import Markdown from 'react-markdown';
import {
  describeDataset,
  formatDate,
  type Methodology,
  type Provenance,
  splitSections,
} from '#src/modules/methodology/domain/methodology.ts';

interface Props {
  methodology: Methodology;
  provenance: Provenance;
  /** Section affichée à l'ouverture, au lieu du début. */
  initialSection?: string | undefined;
}

const FILES_SECTION = { id: 'fichiers', title: 'Les fichiers utilisés' };

/** La méthode en sections, avec un sommaire cliquable, puis la liste des fichiers de données. */
export function MethodologyView({ methodology, provenance, initialSection }: Props) {
  const { intro, sections } = splitSections(methodology.markdown);
  const imported = formatDate(provenance.importedAt);
  const toc = [...sections, FILES_SECTION];
  const goTo = (id: string): void => {
    document.getElementById(`methode-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  useEffect(() => {
    if (initialSection) document.getElementById(`methode-${initialSection}`)?.scrollIntoView({ block: 'start' });
  }, [initialSection]);

  return (
    <div className="prose method">
      <div className="method__intro">
        <Markdown>{intro}</Markdown>
      </div>
      <nav className="method__toc" aria-label="Sommaire">
        {toc.map((section) => (
          <button key={section.id} type="button" className="method__toc-item" onClick={() => goTo(section.id)}>
            {section.title}
          </button>
        ))}
      </nav>
      {sections.map((section) => (
        <section key={section.id} id={`methode-${section.id}`} className="method__section">
          <h2>{section.title}</h2>
          <Markdown>{section.body}</Markdown>
        </section>
      ))}
      <section id={`methode-${FILES_SECTION.id}`} className="method__section">
        <h2>{FILES_SECTION.title}</h2>
        <p>
          Données importées{imported ? ` le ${imported}` : ''} depuis l'open data de l'Assemblée nationale, complétées
          par les pages de <a href={provenance.website}>{provenance.website.replace('https://', '')}</a>.
        </p>
        <ul>
          {provenance.datasets.map((d) => (
            <li key={d.url}>
              <a href={d.url}>{describeDataset(d)}</a> — {d.licence}
            </li>
          ))}
        </ul>
        {provenance.repository && (
          <p>
            Le code qui télécharge, trie et calcule est public :{' '}
            <a href={provenance.repository}>{provenance.repository}</a>.
          </p>
        )}
      </section>
    </div>
  );
}
