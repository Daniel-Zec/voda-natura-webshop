import { routes } from '../lib/url';

/** Main category menu, as in the homepage mock-up. URLs follow the SEO Build Guide. */
export const mainNav = [
  { label: 'Voda za piće', href: routes.category('filteri-za-pijacu-vodu') },
  { label: 'Cela kuća', href: routes.category('filteri-za-celu-kucu') },
  { label: 'Omekšivači', href: routes.category('omeksivaci-vode') },
  { label: 'Tuš i aparati', href: routes.category('tus-i-kucni-aparati') },
  { label: 'Ulošci', href: routes.category('ulosci') },
  { label: 'Saveti o vodi', href: routes.guides() },
];

export const finderLink = { label: 'Pronađi pravi filter', href: routes.finder() };

export const footerNav = {
  shop: {
    title: 'Prodavnica',
    links: [
      { label: 'Voda za piće', href: routes.category('filteri-za-pijacu-vodu') },
      { label: 'Reverzna osmoza', href: routes.category('reverzna-osmoza') },
      { label: 'Cela kuća', href: routes.category('filteri-za-celu-kucu') },
      { label: 'Omekšivači', href: routes.category('omeksivaci-vode') },
      { label: 'Ulošci', href: routes.category('ulosci') },
    ],
  },
  buying: {
    title: 'Kupovina',
    links: [
      { label: 'Dostava i plaćanje', href: routes.page('isporuka-i-placanje') },
      { label: 'Reklamacije i povraćaj', href: routes.page('reklamacije-i-povracaj') },
      { label: 'Garancija', href: routes.page('garancija') },
      { label: 'Ugradnja', href: routes.page('ugradnja') },
    ],
  },
  about: {
    title: 'VodaNatura',
    links: [
      { label: 'Vodiči', href: routes.guides() },
      { label: 'O nama', href: routes.page('o-nama') },
      { label: 'Kontakt', href: routes.page('kontakt') },
    ],
  },
  legal: [
    { label: 'Uslovi kupovine', href: routes.page('uslovi-kupovine') },
    { label: 'Privatnost', href: routes.page('politika-privatnosti') },
    { label: 'Kolačići', href: routes.page('kolacici') },
  ],
};
