import { defineConfig } from 'vitest/config';

/** Les imports absolus `#src/`, `#data/` et `#scripts/` viennent du champ `imports` de package.json. */
export default defineConfig({
  test: {
    include: ['**/*.test.ts'],
    exclude: ['node_modules', 'data/cache'],
  },
});
