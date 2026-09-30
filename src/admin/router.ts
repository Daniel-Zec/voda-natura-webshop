import { useEffect, useState } from 'react';

/**
 * Hash routes (#/porudzbine/12), so the admin works as one static page on any host.
 * Supabase auth links also use the hash (#access_token=…); those are not routes.
 */
export function parseHash(hash: string): { segments: string[]; query: URLSearchParams } {
  if (hash.includes('access_token=') || hash.includes('error_description=')) return { segments: [], query: new URLSearchParams() };
  const raw = hash.replace(/^#\/?/, '');
  const [path, q = ''] = raw.split('?');
  return { segments: path.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(q) };
}

export function useRoute() {
  const [hash, setHash] = useState(() => (typeof window === 'undefined' ? '' : window.location.hash));
  useEffect(() => {
    const on = () => {
      setHash(window.location.hash);
      window.scrollTo(0, 0);
    };
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  return parseHash(hash);
}

export const href = (...parts: (string | number)[]) => `#/${parts.map((p) => encodeURIComponent(String(p))).join('/')}`;

export function go(...parts: (string | number)[]) {
  window.location.hash = href(...parts);
}
