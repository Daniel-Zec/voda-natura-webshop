import { getCollection, type CollectionEntry } from 'astro:content';
import type { GuideSummary } from '../components/shop/GuideCard/GuideCard';
import { routes, url } from './url';

export type Guide = CollectionEntry<'vodic'>;

/** Published guides, in the order set in their front matter (1 = featured). */
export async function getGuides(): Promise<Guide[]> {
  const all = await getCollection('vodic', (g) => !g.data.draft);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** About 200 words a minute, never less than 2. */
export function readingMinutes(guide: Guide): number {
  const words = (guide.body ?? '').replace(/[#*|>\-[\]()]/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(2, Math.round(words / 200));
}

export function toGuideSummary(guide: Guide): GuideSummary {
  return {
    title: guide.data.title,
    description: guide.data.description,
    href: routes.guide(guide.id),
    topic: guide.data.topic,
    minutes: readingMinutes(guide),
    image: { src: url(guide.data.image.src), alt: guide.data.image.alt },
  };
}

const months = ['januar', 'februar', 'mart', 'april', 'maj', 'jun', 'jul', 'avgust', 'septembar', 'oktobar', 'novembar', 'decembar'];
/** 2026-10-01 → "1. oktobar 2026." */
export const formatDateSr = (d: Date) => `${d.getUTCDate()}. ${months[d.getUTCMonth()]} ${d.getUTCFullYear()}.`;
