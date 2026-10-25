/**
 * Géométrie d'un hémicycle : place `count` sièges en arcs concentriques et les renvoie
 * de gauche à droite (par angle décroissant), pour colorer des blocs contigus.
 * Repère : viewBox 0 0 200 104, centre (100, 100), rayon extérieur 92.
 */

export interface SeatPosition {
  x: number;
  y: number;
  /** Rayon du point, adapté au nombre de sièges. */
  r: number;
}

export const VIEWBOX = { width: 200, height: 104 };
const OUTER_RADIUS = 92;
const INNER_RADIUS = 34;

/** Rayon d'un siège : grand pour une poignée de sièges, petit pour des centaines. */
export function seatRadius(count: number): number {
  if (count <= 0) return 5.2;
  return Math.min(5.2, Math.max(1.7, 5.2 * Math.sqrt(60 / count)));
}

export function layoutSeats(count: number): SeatPosition[] {
  if (count <= 0) return [];
  const r = seatRadius(count);
  const rowStep = r * 2.5;
  const rows: Array<{ radius: number; capacity: number }> = [];
  let capacity = 0;
  for (let radius = OUTER_RADIUS; radius >= INNER_RADIUS && capacity < count; radius -= rowStep) {
    const rowCapacity = Math.max(1, Math.floor((Math.PI * radius) / (r * 2.3)));
    rows.push({ radius, capacity: rowCapacity });
    capacity += rowCapacity;
  }
  // Sans place suffisante, on resserre les points (rare : au-delà de ~600 sièges).
  const scale = capacity < count ? count / capacity : 1;
  let remaining = count;
  const positions: Array<SeatPosition & { angle: number }> = [];
  rows.forEach((row, index) => {
    const isLast = index === rows.length - 1;
    const share = Math.ceil((row.capacity * scale * count) / (capacity * scale));
    const seats = isLast ? remaining : Math.min(remaining, share);
    remaining -= seats;
    for (let i = 0; i < seats; i += 1) {
      const angle = Math.PI - (Math.PI * (i + 0.5)) / seats;
      positions.push({ angle, x: 100 + row.radius * Math.cos(angle), y: 100 - row.radius * Math.sin(angle), r });
    }
  });
  return positions.sort((a, b) => b.angle - a.angle).map(({ x, y, r: radius }) => ({ x, y, r: radius }));
}

/** Un bloc de sièges survolable : son nom et une ligne de détail s'affichent dans une bulle. */
export interface SeatGroup {
  id: string;
  label: string;
  detail: string;
}

export interface Seat {
  color: string;
  /** Texte au survol. */
  title?: string;
  group?: SeatGroup;
}

/**
 * Répartit `total` sièges entre des couleurs selon des parts (égales si absentes), dans l'ordre donné.
 * `groups`, aligné sur `colors`, rend chaque bloc survolable.
 */
export function seatsByShare(
  colors: readonly string[],
  shares: readonly number[] | undefined,
  total: number,
  groups?: readonly SeatGroup[],
): Seat[] {
  if (colors.length === 0 || total <= 0) return [];
  const weights = shares && shares.length === colors.length ? shares : colors.map(() => 1);
  const sum = weights.reduce((acc, w) => acc + Math.max(0, w), 0) || 1;
  const seats: Seat[] = [];
  colors.forEach((color, i) => {
    const count = Math.round((total * Math.max(0, weights[i] ?? 0)) / sum);
    const group = groups?.[i];
    for (let k = 0; k < count; k += 1) seats.push(group ? { color, group } : { color });
  });
  while (seats.length < total) seats.push({ color: '#c9c4b8' });
  return seats.slice(0, total);
}
