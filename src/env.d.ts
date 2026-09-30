/// <reference types="astro/client" />

interface ImportMetaEnv {
  /** "true" builds the admin panel with sample data (screenshots, tests). Never set on the live site. */
  readonly PUBLIC_ADMIN_DEMO?: string;
  readonly PUBLIC_NOINDEX?: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
