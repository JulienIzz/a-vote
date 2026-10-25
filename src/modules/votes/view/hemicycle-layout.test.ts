import { describe, expect, it } from 'vitest';
import { layoutSeats, seatRadius, seatsByShare, VIEWBOX } from '#src/modules/votes/view/hemicycle-layout.ts';

describe('layoutSeats', () => {
  it('place exactement le nombre de sièges demandé, dans le cadre, de gauche à droite', () => {
    for (const count of [1, 12, 60, 360, 577]) {
      const seats = layoutSeats(count);
      expect(seats).toHaveLength(count);
      for (const s of seats) {
        expect(s.x).toBeGreaterThanOrEqual(0);
        expect(s.x).toBeLessThanOrEqual(VIEWBOX.width);
        expect(s.y).toBeGreaterThanOrEqual(0);
        expect(s.y).toBeLessThanOrEqual(VIEWBOX.height);
      }
      if (count > 1) expect(seats[0]?.x).toBeLessThan(seats[count - 1]?.x ?? 0);
    }
    expect(layoutSeats(0)).toEqual([]);
    expect(seatRadius(360)).toBeLessThan(seatRadius(60));
  });
});

describe('seatsByShare', () => {
  it('répartit les sièges selon les parts et complète en gris', () => {
    const seats = seatsByShare(['#a', '#b'], [3, 1], 8);
    expect(seats.filter((s) => s.color === '#a')).toHaveLength(6);
    expect(seats.filter((s) => s.color === '#b')).toHaveLength(2);
    expect(seatsByShare(['#a', '#b'], undefined, 4).map((s) => s.color)).toEqual(['#a', '#a', '#b', '#b']);
    expect(seatsByShare(['#a'], [0], 2).map((s) => s.color)).toEqual(['#c9c4b8', '#c9c4b8']);
  });
});
