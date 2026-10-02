import type { Meta, StoryObj } from '@storybook/react-vite';
import type { CartProduct } from '../../../lib/cartStore';
import { CartPage } from './CartPage';

export const sampleCatalog: Record<string, CartProduct> = {
  RO6: { sku: 'RO6', name: 'RO 6 WFU – Sistem reverzne osmoze', href: '#', price: 56899, stock: 'inStock', image: { src: 'images/products/ro-6-wfu-reverzna-osmoza.webp', alt: '' } },
  'BL-10': { sku: 'BL-10', name: 'BL 10 – Uložak od aktivnog uglja za kućište od 10″', href: '#', price: 606, stock: 'inStock', image: { src: 'images/products/fscnt-kuhinjski-filter.webp', alt: '' } },
  MATTEO: { sku: 'MATTEO', name: 'Matteo – četvorostepeni sistem velikog protoka', href: '#', price: 89900, stock: 'madeToOrder', image: { src: 'images/products/ro-6-wfu-reverzna-osmoza.webp', alt: '' } },
  'IR-10': { sku: 'IR-10', name: 'IR 10 – Uložak za uklanjanje gvožđa', href: '#', price: 3200, stock: 'outOfStock', image: { src: 'images/products/fscnt-kuhinjski-filter.webp', alt: '' } },
};

const meta = {
  title: 'Shop/CartPage',
  component: CartPage,
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'The /korpa/ page: cart lines from the browser, checked against the catalogue (current price and stock). Out-of-stock lines block ordering until removed; made-to-order lines stay in the order with a note. Shipping is paid to the courier, so the total is products only.' } },
  },
  args: {
    catalog: sampleCatalog,
    checkoutHref: '#',
    shopHref: '#',
    cartridgesHref: '#',
    deliveryEstimate: 'oko 4 radna dana',
    shippingNote: 'Troškove dostave plaćate kuriru prilikom preuzimanja.',
    initialLines: [
      { sku: 'RO6', name: 'RO 6 WFU', price: 56899, qty: 1 },
      { sku: 'BL-10', name: 'BL 10', price: 606, qty: 2 },
    ],
  },
} satisfies Meta<typeof CartPage>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
export const WithMadeToOrder: StoryObj<typeof meta> = {
  args: { initialLines: [{ sku: 'BL-10', name: 'BL 10', price: 606, qty: 2 }, { sku: 'MATTEO', name: 'Matteo', price: 89900, qty: 1 }] },
};
export const OutOfStockLine: StoryObj<typeof meta> = {
  args: { initialLines: [{ sku: 'RO6', name: 'RO 6 WFU', price: 56899, qty: 1 }, { sku: 'IR-10', name: 'IR 10', price: 3200, qty: 1 }] },
};
export const Empty: StoryObj<typeof meta> = { args: { initialLines: [] } };
