import { type PointerEvent, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { layoutSeats, type Seat, type SeatGroup, VIEWBOX } from '#src/modules/votes/view/hemicycle-layout.ts';

interface Props {
  /** Sièges de gauche à droite, déjà colorés. */
  seats: readonly Seat[];
  className?: string;
}

interface Hover {
  group: SeatGroup;
  color: string;
  visible: boolean;
}

/** Temps de réponse de la bulle qui suit le curseur (ms) : plus il est grand, plus elle traîne. */
const FOLLOW_MS = 70;

/**
 * Un hémicycle en SVG : un point par siège, rangé en arcs.
 * Si les sièges portent un groupe, survoler un bloc l'éclaire et une bulle suit le curseur.
 */
export function Hemicycle({ seats, className }: Props) {
  const positions = layoutSeats(seats.length);
  const interactive = seats.some((seat) => seat.group);
  const [hover, setHover] = useState<Hover | null>(null);
  const bubble = useSmoothFollow();

  // Le siège le plus proche du curseur, pour que les interstices entre points ne fassent pas clignoter la bulle.
  const seatAt = (svg: SVGSVGElement, clientX: number, clientY: number): Seat | undefined => {
    const rect = svg.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * VIEWBOX.width;
    const y = ((clientY - rect.top) / rect.height) * VIEWBOX.height;
    let best: Seat | undefined;
    let bestDistance = Number.POSITIVE_INFINITY;
    positions.forEach((p, i) => {
      const distance = Math.hypot(p.x - x, p.y - y);
      if (distance < p.r * 2 && distance < bestDistance) {
        best = seats[i];
        bestDistance = distance;
      }
    });
    return best;
  };

  const onPointerMove = (event: PointerEvent<SVGSVGElement>): void => {
    if (event.pointerType === 'touch') return;
    const seat = seatAt(event.currentTarget, event.clientX, event.clientY);
    const group = seat?.group;
    if (seat && group) {
      bubble.moveTo(event.clientX, event.clientY);
      setHover((prev) => (prev?.visible && prev.group === group ? prev : { group, color: seat.color, visible: true }));
    } else {
      bubble.release();
      setHover((prev) => (prev?.visible ? { ...prev, visible: false } : prev));
    }
  };

  const onPointerLeave = (): void => {
    bubble.release();
    setHover((prev) => (prev?.visible ? { ...prev, visible: false } : prev));
  };

  const activeId = hover?.visible ? hover.group.id : null;
  return (
    <>
      <svg
        viewBox={`0 0 ${VIEWBOX.width} ${VIEWBOX.height}`}
        className={className}
        aria-hidden="true"
        focusable="false"
        onPointerMove={interactive ? onPointerMove : undefined}
        onPointerLeave={interactive ? onPointerLeave : undefined}
      >
        {positions.map((p, i) => {
          const seat = seats[i];
          const dim = activeId !== null && seat?.group?.id !== activeId;
          return (
            <circle
              key={`${p.x.toFixed(2)}-${p.y.toFixed(2)}`}
              cx={p.x}
              cy={p.y}
              r={p.r}
              fill={seat?.color ?? '#c9c4b8'}
              className={interactive ? `seat${dim ? ' seat--dim' : ''}` : undefined}
            >
              {seat?.title && <title>{seat.title}</title>}
            </circle>
          );
        })}
      </svg>
      {interactive &&
        createPortal(
          <div
            ref={bubble.ref}
            className={`seat-bubble${hover?.visible ? ' seat-bubble--visible' : ''}`}
            aria-hidden="true"
          >
            {hover && (
              <div className="seat-bubble__body">
                <span className="seat-bubble__label">
                  <span className="swatch" style={{ background: hover.color }} />
                  {hover.group.label}
                </span>
                <strong className="seat-bubble__detail">{hover.group.detail}</strong>
              </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
}

/**
 * Fait glisser un élément en position fixe vers le curseur, avec un amorti exponentiel calé sur le temps
 * (même rendu à 60 ou 120 Hz). Le style est écrit directement : pas de rendu React à chaque image.
 */
function useSmoothFollow() {
  const ref = useRef<HTMLDivElement>(null);
  const motion = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, placed: false, frame: 0, last: 0 });

  useEffect(() => () => cancelAnimationFrame(motion.current.frame), []);

  const paint = (): void => {
    const m = motion.current;
    if (ref.current) ref.current.style.transform = `translate3d(${m.x}px, ${m.y}px, 0)`;
  };

  const step = (now: number): void => {
    const m = motion.current;
    const k = 1 - Math.exp(-Math.min(64, now - m.last) / FOLLOW_MS);
    m.last = now;
    m.x += (m.targetX - m.x) * k;
    m.y += (m.targetY - m.y) * k;
    paint();
    const settled = Math.abs(m.targetX - m.x) < 0.1 && Math.abs(m.targetY - m.y) < 0.1;
    m.frame = settled ? 0 : requestAnimationFrame(step);
  };

  const moveTo = (x: number, y: number): void => {
    const m = motion.current;
    m.targetX = x;
    m.targetY = y;
    // À l'entrée dans un groupe, la bulle apparaît sous le curseur au lieu d'arriver de sa dernière position.
    if (!m.placed || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      cancelAnimationFrame(m.frame);
      m.frame = 0;
      m.x = x;
      m.y = y;
      m.placed = true;
      paint();
      return;
    }
    if (!m.frame) {
      m.last = performance.now();
      m.frame = requestAnimationFrame(step);
    }
  };

  const release = (): void => {
    motion.current.placed = false;
  };

  return { ref, moveTo, release };
}
