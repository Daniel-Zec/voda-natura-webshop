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
    /** Public phone for help choosing and installing: Decor Ambient's sales line (VodaNatura operates under DA). */
    phone: '+381 63 29 22 19',
    /** Tel link, set together with phone, e.g. '+381641234567'. Empty = no link. */
    phoneHref: '+381632922219',
    email: 'info@vodanatura.com',
    /** Decor Ambient's hours: Mon–Fri 8–16, closed on weekends */
    hours: 'Ponedeljak–petak, 8–16 h',
    openingHours: 'Mo-Fr 08:00-16:00',
    /** Decor Ambient's address (the seller), from decorambient.com/kontakt */
    address: { street: 'Filipa Kljajića 22', postalCode: '24000', city: 'Subotica', country: 'RS' },
  },

  partner: {
    name: 'Decor Ambient d.o.o.',
    city: 'Subotica',
    /** Legal details for the legal pages (Agencija za privredne registre, via decorambient.ls.rs, checked 2 Oct 2026). */
    legalName: 'Decorambient d.o.o. za unutrašnju i spoljnu trgovinu, Subotica',
    shortLegalName: 'Decorambient d.o.o.',
    registrationNumber: '20771097',
    taxId: '107266559',
    /** Installation in Subotica is booked by calling Decor Ambient (VODANATURA-75, q. 10). */
    installationPhone: '+381 63 29 22 19',
    /** No fixed installation price: it depends on the system, the place it goes and the distance, so it is agreed by phone (decided 1 Oct 2026). */
  },

  delivery: {
    courier: 'BEX',
    /** Not confirmed yet (q. 8): "probably about 4 working days". */
    estimate: 'oko 4 radna dana',
    /** Shipping is paid to the courier on delivery; the site shows no shipping price (q. 8). */
    note: 'Troškove dostave plaćate kuriru prilikom preuzimanja.',
  },

  /**
   * Social profiles, shown as icons in the footer and as `sameAs` in the Organization JSON-LD.
   * Empty url = the icon shows dimmed and not clickable ("uskoro") until Daniel sends the link.
   */
  social: [
    { network: 'instagram', label: 'Instagram', url: '' },
    { network: 'facebook', label: 'Facebook', url: '' },
  ],

  warrantyYears: 2,
} as const;

export type Site = typeof site;
