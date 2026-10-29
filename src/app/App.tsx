import { lazy, Suspense } from 'react';
import { Link, NavLink, Route, Routes } from 'react-router';
import { Logo } from '#src/app/Logo.tsx';
import { MethodologyButton, MethodologyDialogProvider } from '#src/app/MethodologyDialog.tsx';
import { HomePage } from '#src/app/pages/HomePage.tsx';
import { QuestionPage } from '#src/app/pages/QuestionPage.tsx';

// Les résultats arrivent en fin de parcours : leur code se charge à part.
const ResultsPage = lazy(() => import('#src/app/pages/ResultsPage.tsx').then((m) => ({ default: m.ResultsPage })));
// Les candidatures à la présidentielle sont un onglet à part du parcours : leur code aussi.
const CandidatesPage = lazy(() =>
  import('#src/app/pages/CandidatesPage.tsx').then((m) => ({ default: m.CandidatesPage })),
);

export function App() {
  return (
    <MethodologyDialogProvider>
      <div className="shell">
        <header className="topbar">
          <Link to="/" className="brand" aria-label="A voté, accueil">
            <Logo />
          </Link>
          <nav className="topbar__nav" aria-label="Navigation principale">
            <NavLink to="/candidats" className="topbar__tab">
              Présidentielle 2027
            </NavLink>
            <MethodologyButton className="topbar__help">
              <QuestionMarkIcon /> <span className="topbar__help-label">Comment ça marche ?</span>
            </MethodologyButton>
          </nav>
        </header>
        <div className="tricolore" aria-hidden="true" />
        <main className="main">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/question/:n" element={<QuestionPage />} />
            <Route
              path="/resultats"
              element={
                <Suspense fallback={null}>
                  <ResultsPage />
                </Suspense>
              }
            />
            <Route
              path="/candidats"
              element={
                <Suspense fallback={null}>
                  <CandidatesPage />
                </Suspense>
              }
            />
            <Route path="*" element={<HomePage />} />
          </Routes>
        </main>
        <footer className="footer">
          <p>Données publiques de l'Assemblée nationale, sous Licence Ouverte 2.0.</p>
          <a className="footer__github" href="https://github.com/JuuuIzzz/a-vote" target="_blank" rel="noreferrer">
            <GitHubIcon /> Code source sur GitHub
          </a>
        </footer>
      </div>
    </MethodologyDialogProvider>
  );
}

function QuestionMarkIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false" className="icon">
      <circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1.2" fill="currentColor" />
    </svg>
  );
}

function GitHubIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false" className="icon">
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}
