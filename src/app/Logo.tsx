/** Logo « A voté » : une urne transparente où glisse une enveloppe, au-dessus de bulletins bleu-blanc-rouge. */
export function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 32 32" width="34" height="34" aria-hidden="true" focusable="false" className="logo__urne">
        <g className="logo__envelope">
          <rect x="10" y="1" width="12" height="11" rx="1.2" fill="var(--paper)" />
          <path d="M10.6 1.8 16 6l5.4-4.2" fill="none" stroke="var(--bleu)" strokeWidth="1.4" strokeLinejoin="round" />
        </g>
        <rect x="3.5" y="10" width="25" height="4" rx="1.2" fill="var(--paper)" />
        <rect x="10.5" y="11.4" width="11" height="1.3" rx="0.65" fill="var(--navy)" />
        <rect
          x="5"
          y="14"
          width="22"
          height="15.5"
          rx="1.6"
          fill="rgba(255,255,255,0.12)"
          stroke="var(--paper)"
          strokeWidth="1.6"
        />
        <rect x="7.5" y="24" width="6" height="4" rx="0.6" fill="var(--bleu)" />
        <rect x="13" y="24" width="6" height="4" rx="0.6" fill="var(--blanc)" />
        <rect x="18.5" y="24" width="6" height="4" rx="0.6" fill="var(--rouge)" />
      </svg>
      <span className="logo__word">
        A vot<span className="logo__accent">é</span>
      </span>
    </span>
  );
}
