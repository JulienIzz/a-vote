import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

/** Site statique : `pnpm dev` pour développer, `pnpm build` produit dist/ (publié sur Netlify). */
export default defineConfig({
  plugins: [react()],
  build: { outDir: 'dist' },
});
