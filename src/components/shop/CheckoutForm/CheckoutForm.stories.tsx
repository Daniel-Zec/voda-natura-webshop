import type { Meta, StoryObj } from '@storybook/react-vite';
import { sampleCatalog } from '../CartPage/CartPage.stories';
import { CheckoutForm } from './CheckoutForm';

const meta = {
  title: 'Shop/CheckoutForm',
  component: CheckoutForm,
  parameters: {
    layout: 'padded',
    docs: { description: { component: 'The /porudzbina/ page: guest checkout in Decor Ambient\'s order format (Ime, Prezime, Ulica, Broj, Stan, Grad, Poštanski broj, Telefon, Email) plus a note and consent to the terms. Sends the cart to the `create-order` Edge Function. In Storybook it only pretends to send.' } },
  },
  args: {
    catalog: sampleCatalog,
    endpoint: '#',
    thanksHref: '#',
    cartHref: '#',
    termsHref: '#',
    privacyHref: '#',
    phone: '+381 63 29 22 19',
    deliveryEstimate: 'oko 4 radna dana',
    shippingNote: 'Troškove dostave plaćate kuriru prilikom preuzimanja.',
    seller: 'Decorambient d.o.o., Subotica',
    demo: true,
    initialLines: [
      { sku: 'RO6', name: 'RO 6 WFU', price: 56899, qty: 1 },
      { sku: 'BL-10', name: 'BL 10', price: 606, qty: 2 },
    ],
  },
} satisfies Meta<typeof CheckoutForm>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
export const WithMadeToOrder: StoryObj<typeof meta> = {
  args: { initialLines: [{ sku: 'BL-10', name: 'BL 10', price: 606, qty: 2 }, { sku: 'MATTEO', name: 'Matteo', price: 89900, qty: 1 }] },
};
export const EmptyCart: StoryObj<typeof meta> = { args: { initialLines: [] } };
