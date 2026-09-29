// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// While testing on GitHub Pages the site lives under /voda-natura-webshop/.
// When the real host is chosen, set SITE_URL=https://vodanatura.com and BASE_PATH=/ .
const site = process.env.SITE_URL ?? 'https://daniel-zec.github.io';
const base = process.env.BASE_PATH ?? '/voda-natura-webshop';

export default defineConfig({
  site,
  base,
  trailingSlash: 'always',
  output: 'static',
  integrations: [react()],
  build: { format: 'directory' },
});
