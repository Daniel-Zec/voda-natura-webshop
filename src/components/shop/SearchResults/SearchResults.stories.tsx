import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchResults, type SearchProduct } from './SearchResults';

const products: SearchProduct[] = [
  {
    href: '#',
    category: 'Ulošci od aktivnog uglja',
    product: { sku: 'STO 10', slug: 'sto-10-ulozak', name: 'STO 10 – Uložak Polipropilen – Aktivni ugalj za kućište od 10″', kicker: 'Za FSCNT · 2 stepena', summary: 'Pesak do 10 mikrona i hlor.', price: 1219, stock: 'inStock', image: { src: 'images/products/sto-10-ulozak.webp', alt: '' } },
  },
  {
    href: '#',
    category: 'Reverzna osmoza',
    product: { sku: 'RO6', slug: 'ro-6-wfu-reverzna-osmoza', name: 'RO 6 WFU – Sistem Reverzne Osmoze', kicker: 'Ispod sudopere · 6 stepeni', summary: 'Do 284 l vode za piće dnevno.', price: 56899, stock: 'inStock', image: { src: 'images/products/ro-6-wfu-reverzna-osmoza.webp', alt: '' } },
  },
];

const meta = {
  title: 'Shop/SearchResults',
  component: SearchResults,
  parameters: {
    docs: { description: { component: 'Search results on /pretraga/?q=…. Finds products by name or code (spaces, dashes and Serbian letters are ignored: "sto10" finds STO 10) and matching guides.' } },
  },
  args: {
    products,
    guides: [{ title: 'Hlor u vodi: zašto voda miriše na bazen', description: 'Koji filter uklanja hlor.', href: '#' }],
    suggestions: [{ label: 'Ulošci', href: '#' }, { label: 'Reverzna osmoza', href: '#' }],
    contactHref: '#',
    initialQuery: 'sto10',
  },
} satisfies Meta<typeof SearchResults>;
export default meta;

export const ByCode: StoryObj<typeof meta> = {};
export const ByWord: StoryObj<typeof meta> = { args: { initialQuery: 'hlor' } };
export const NothingFound: StoryObj<typeof meta> = { args: { initialQuery: 'akvarijum' } };
