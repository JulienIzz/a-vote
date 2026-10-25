import { describe, expect, it } from 'vitest';
import { parseLegislatures, scrutinPageUrl } from '#scripts/paths.ts';

describe('parseLegislatures', () => {
  it('accepte une liste, refuse une législature inconnue', () => {
    expect(parseLegislatures(undefined)).toEqual([16, 17]);
    expect(parseLegislatures('17, 16')).toEqual([17, 16]);
    expect(() => parseLegislatures('18')).toThrow('Législature non prise en charge');
  });
});

describe('scrutinPageUrl', () => {
  it('construit la page officielle du scrutin', () => {
    expect(scrutinPageUrl(17, 8431)).toBe('https://www.assemblee-nationale.fr/dyn/17/scrutins/8431');
  });
});
