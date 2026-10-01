/**
 * Search by product name or code, tolerant of spaces, dashes and Serbian letters:
 * "sto10", "STO 10" and "Sto-10" all find STO 10; "uloSak" finds "uložak".
 */
export const normalize = (s: string) =>
  s
    .toLowerCase()
    .replace(/đ/g, 'dj')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

export const compact = (s: string) => normalize(s).replace(/ /g, '');

export interface Searchable {
  /** Product code, e.g. "STO 10" */
  code: string;
  name: string;
  /** Category, kicker, summary: matched with lower weight */
  extra: string;
}

/** Score of one item for a query; 0 = no match. Higher is better. */
export function score(item: Searchable, query: string): number {
  const q = normalize(query);
  if (!q) return 0;
  const qc = q.replace(/ /g, '');
  const code = compact(item.code);
  const name = normalize(item.name);
  const nameC = name.replace(/ /g, '');
  const extra = normalize(item.extra);

  if (code && code === qc) return 1000;
  let s = 0;
  if (code && code.startsWith(qc)) s += 500;
  if (nameC.startsWith(qc)) s += 400;
  else if (nameC.includes(qc)) s += 250;

  // Every word of the query must appear somewhere (name, code or extra text).
  // Words match from the start of a word ("sto" finds "STO 10", not "penaSTOg").
  const words = q.split(' ');
  const starts = (text: string, w: string) => ` ${text}`.includes(` ${w}`);
  for (const w of words) {
    if (starts(name, w)) s += 40;
    else if (code.startsWith(w)) s += 40;
    else if (starts(extra, w)) s += 10;
    else return s >= 250 ? s : 0;
  }
  return s;
}

/** Code match threshold: when the query is (the start of) a product code, show only those products. */
export const CODE_MATCH = 500;
