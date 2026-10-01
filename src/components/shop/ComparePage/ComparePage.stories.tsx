import type { Meta, StoryObj } from '@storybook/react-vite';
import { ComparePage, type CompareProduct } from './ComparePage';

const products: CompareProduct[] = [
  {
    href: '#',
    category: 'Reverzna osmoza',
    specs: [
      { label: 'Maksimalni radni pritisak', value: '2,8 – 6 bara' },
      { label: 'RO membrana', value: '75 GPD (284 lit/dan)' },
      { label: 'Servisni ciklus', value: '6 meseci' },
    ],
    product: { sku: 'RO6', slug: 'ro-6-wfu', name: 'RO 6 WFU – Sistem Reverzne Osmoze', kicker: 'Ispod sudopere · 6 stepeni', summary: 'Do 284 l vode za piće dnevno.', price: 56899, stock: 'inStock', maintenance: 'Membrana na 3 godine, oko 2.170 RSD godišnje', image: { src: 'images/products/ro-6-wfu-reverzna-osmoza.webp', alt: '' } },
  },
  {
    href: '#',
    category: 'Voda za piće',
    specs: [
      { label: 'Maksimalni radni pritisak', value: '6 bara' },
      { label: 'Efikasan protok', value: '6 l/min' },
      { label: 'Servisni ciklus', value: '6 meseci' },
    ],
    product: { sku: 'FSCNT', slug: 'fscnt', name: 'FSCNT – Kuhinjski filter nadgradni', kicker: 'Na slavinu · bez bušenja', summary: 'Uklanja pesak, hlor i organska jedinjenja.', price: 6422, stock: 'inStock', maintenance: 'STO 10 na 6 meseci, 2.438 RSD godišnje', image: { src: 'images/products/fscnt-kuhinjski-filter.webp', alt: '' } },
  },
];

const meta = {
  title: 'Shop/ComparePage',
  component: ComparePage,
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'The /uporedi/ page: up to 3 products ticked with "Uporedi", side by side, with "only differences" and remove. Reads the same browser store as the header counter.' } },
  },
  args: { products, browse: [{ label: 'Voda za piće', href: '#' }, { label: 'Ulošci', href: '#' }], initialSkus: ['RO6', 'FSCNT'] },
} satisfies Meta<typeof ComparePage>;
export default meta;

export const TwoProducts: StoryObj<typeof meta> = {};
export const Empty: StoryObj<typeof meta> = { args: { initialSkus: [] } };
