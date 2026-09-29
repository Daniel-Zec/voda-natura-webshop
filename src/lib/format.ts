/** Formats a whole-dinar amount the Serbian way: 56899 → "56.899". */
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

/** 56899 → "56.899 RSD" */
export function formatRSD(value: number): string {
  return `${formatNumber(value)} RSD`;
}

/** Removes Serbian diacritics for URL slugs (š→s, đ→dj, č/ć→c, ž→z), as the SEO guide requires. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
