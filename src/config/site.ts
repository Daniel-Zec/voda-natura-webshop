/**
 * Shop-wide settings in one place.
 *
 * Values in [BRACKETS] are still missing (see Jira VODANATURA-75). They show on the
 * test site exactly like this so nobody mistakes them for real data. Later these
 * move to the admin panel settings (Supabase), so they can change without code.
 */
export const site = {
  name: 'VodaNatura',
  tagline: 'Filteri vode za vaš dom',
  url: 'https://vodanatura.com',
  locale: 'sr-Latn',

  contact: {
    /** Public phone for help choosing and installing. */
    phone: '[TELEFON]',
    /** Tel link, set together with phone, e.g. '+381641234567'. Empty = no link. */
    phoneHref: '',
    email: 'info@vodanatura.com',
    hours: 'Radnim danima [RADNO VREME]',
  },

  partner: {
    name: 'Decor Ambient d.o.o.',
    city: 'Subotica',
    /** Installation in Subotica is booked by calling Decor Ambient (VODANATURA-75, q. 10). */
    installationPhone: '[TELEFON DECOR AMBIENT]',
    installationPrice: '[CENA UGRADNJE]',
  },

  delivery: {
    courier: 'BEX',
    /** Not confirmed yet (q. 8): "probably about 4 working days". */
    estimate: 'oko 4 radna dana',
    /** Shipping is paid to the courier on delivery; the site shows no shipping price (q. 8). */
    note: 'Troškove dostave plaćate kuriru prilikom preuzimanja.',
  },

  warrantyYears: 2,
} as const;

export type Site = typeof site;
