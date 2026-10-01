/**
 * Content collections. "vodic" holds the "Saveti o vodi" guides (Markdown in src/content/vodic/),
 * shown on /vodic/ and /vodic/{slug}/. Facts in guides must link a source (SEO Build Guide, writing rules).
 */
import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const vodic = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/vodic' }),
  schema: z.object({
    title: z.string(),
    /** <title>, "{Question or topic} | VodaNatura vodič" */
    seoTitle: z.string(),
    /** Meta description and card text */
    description: z.string(),
    /** Internal: keeps two guides from targeting the same keyword */
    primaryKeyword: z.string(),
    /** Short topic label on cards ("Ukus i hlor") */
    topic: z.string(),
    /** Order on the guides page; 1 is the featured guide */
    order: z.number(),
    author: z.string(),
    datePublished: z.coerce.date(),
    dateModified: z.coerce.date(),
    /** "Kratak odgovor": the answer in 2–4 sentences, shown above the article */
    answer: z.string(),
    /** Header image, path under /public */
    image: z.object({ src: z.string(), alt: z.string() }),
    /** Product slugs shown in "Proizvodi iz vodiča" */
    products: z.array(z.string()).default([]),
    related: z.array(z.object({ label: z.string(), href: z.string() })).default([]),
    /** Hidden from the site while true */
    draft: z.boolean().default(false),
  }),
});

export const collections = { vodic };
