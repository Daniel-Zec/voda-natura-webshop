import type { Meta, StoryObj } from '@storybook/react-vite';
import { BuyBox } from './BuyBox';

const meta = {
  title: 'Shop/BuyBox',
  component: BuyBox,
  parameters: { docs: { description: { component: 'Price and buy actions on the product page, with the cash-on-delivery badge next to the price and the delivery, payment, warranty and running-cost facts. Made-to-order shows the 3–4 month notice; out of stock disables the button.' } } },
  args: {
    sku: 'RO6',
    name: 'RO 6 WFU – Sistem Reverzne Osmoze',
    price: 56899,
    stock: 'inStock',
    deliveryNote: 'Isporuka za oko 4 radna dana',
    shippingNote: 'Troškove dostave plaćate kuriru prilikom preuzimanja.',
    maintenance: 'Membrana na 3 godine, oko 2.170 RSD godišnje',
  },
  decorators: [(Story) => <div style={{ maxWidth: 520 }}><Story /></div>],
} satisfies Meta<typeof BuyBox>;
export default meta;
export const InStock: StoryObj<typeof meta> = {};
export const MadeToOrder: StoryObj<typeof meta> = { args: { stock: 'madeToOrder', name: 'CW 929 – Vodomat', price: 199344, deliveryNote: 'Isporuka po dolasku robe' } };
export const OutOfStock: StoryObj<typeof meta> = { args: { stock: 'outOfStock', name: 'IR 10', price: 1838, maintenance: undefined } };
