import { describe, expect, it } from 'vitest';
import { initialAnswersState, startDeck } from '#src/modules/answers/domain/state.ts';
import { createKeyValuePersistence, type KeyValueStorage } from '#src/modules/answers/infra/key-value-persistence.ts';

function fakeStorage(): KeyValueStorage & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

describe('createKeyValuePersistence', () => {
  it('sauvegarde, relit, efface, et ignore un contenu corrompu', async () => {
    const storage = fakeStorage();
    const persistence = createKeyValuePersistence(storage, 'k');
    expect(await persistence.load()).toBeNull();
    await persistence.save(startDeck(initialAnswersState(), ['q1']));
    expect((await persistence.load())?.deck).toEqual(['q1']);
    storage.data.set('k', '{not json');
    expect(await persistence.load()).toBeNull();
    storage.data.set('k', '{"deck":"x"}');
    expect(await persistence.load()).toBeNull();
    await persistence.clear();
    expect(storage.data.has('k')).toBe(false);
  });
});
