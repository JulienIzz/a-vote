import {
  createContext,
  lazy,
  type ReactNode,
  Suspense,
  useCallback,
  useContext,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { methodologyRepository } from '#src/app/container.ts';

// La méthode (et react-markdown) ne se charge qu'à la première ouverture de la modale.
const MethodologyView = lazy(() =>
  import('#src/modules/methodology/view/MethodologyView.tsx').then((m) => ({ default: m.MethodologyView })),
);

/**
 * La méthode s'ouvre en modale depuis n'importe quelle page, sans quitter le parcours,
 * éventuellement directement sur une section (son id, tiré de son titre : `les-limites`).
 */
const OpenMethodology = createContext<(section?: string) => void>(() => {});

export function MethodologyDialogProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [section, setSection] = useState<string>();
  const openDialog = useCallback((target?: string) => {
    setSection(target);
    setOpen(true);
  }, []);
  return (
    <OpenMethodology.Provider value={openDialog}>
      {children}
      <MethodologyDialog open={open} section={section} onClose={() => setOpen(false)} />
    </OpenMethodology.Provider>
  );
}

export function MethodologyButton({
  className = 'link',
  section,
  children,
}: {
  className?: string;
  section?: string | undefined;
  children: ReactNode;
}) {
  const open = useContext(OpenMethodology);
  return (
    <button type="button" className={className} onClick={() => open(section)} aria-haspopup="dialog">
      {children}
    </button>
  );
}

function MethodologyDialog({
  open,
  section,
  onClose,
}: {
  open: boolean;
  section?: string | undefined;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  // En layout effect : la modale doit être ouverte avant que la vue ne défile jusqu'à sa section.
  useLayoutEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      dialog.showModal();
      if (bodyRef.current) bodyRef.current.scrollTop = 0;
    }
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: au clavier, Échap ferme déjà un <dialog> natif.
    <dialog
      ref={ref}
      className="dialog"
      aria-labelledby="methodology-title"
      onClose={onClose}
      onClick={(event) => {
        // Un clic sur le fond (hors du contenu) ferme la modale.
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <header className="dialog__head">
        <h2 className="dialog__title" id="methodology-title">
          {methodologyRepository.methodology().title}
        </h2>
        <button type="button" className="dialog__close" onClick={onClose} aria-label="Fermer">
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      {/* Seul le contenu défile : la barre de défilement reste sous l'en-tête, loin des coins arrondis. */}
      <div className="dialog__body" ref={bodyRef}>
        {open && (
          <Suspense fallback={<p className="muted">Chargement…</p>}>
            <MethodologyView
              methodology={methodologyRepository.methodology()}
              provenance={methodologyRepository.provenance()}
              initialSection={section}
            />
          </Suspense>
        )}
      </div>
    </dialog>
  );
}
