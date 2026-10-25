import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { App } from '#src/app/App.tsx';
import { answersStore } from '#src/app/container.ts';
import '@fontsource-variable/bricolage-grotesque';
import '#src/app/styles.css';

const root = document.getElementById('root');
if (!root) throw new Error('Élément #root introuvable');

// Les réponses sauvegardées sont rechargées avant le premier rendu, pour reprendre un parcours en cours.
answersStore.hydrate().finally(() => {
  createRoot(root).render(
    <StrictMode>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </StrictMode>,
  );
});
