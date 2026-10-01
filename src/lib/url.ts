/**
 * Builds a link that works both on the GitHub Pages test site (/voda-natura-webshop/…)
 * and later on vodanatura.com (/…). Always use it for internal links and images.
 */
const rawBase: string =
  (typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL) || '/';
const base = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

export function url(path = ''): string {
  if (/^(https?:|mailto:|tel:|#)/.test(path)) return path;
  const clean = path.replace(/^\/+/, '');
  return `${base}${clean}`;
}

/** Shop routes, following the URL patterns in the SEO Build Guide. */
export const routes = {
  home: () => url(''),
  category: (slug: string) => url(`${slug}/`),
  product: (slug: string) => url(`proizvod/${slug}/`),
  guides: () => url('vodic/'),
  guide: (slug: string) => url(`vodic/${slug}/`),
  page: (slug: string) => url(`${slug}/`),
  /** Kupovina i podrška page, optionally at a section: dostava-i-placanje, reklamacije-i-povracaj, garancija, ugradnja */
  support: (section?: string) => url(`kupovina/${section ? `#${section}` : ''}`),
  search: (q?: string) => url(`pretraga/${q ? `?q=${encodeURIComponent(q)}` : ''}`),
  cart: () => url('korpa/'),
  finder: () => url('izbor-filtera/'),
  compare: () => url('uporedi/'),
} as const;
