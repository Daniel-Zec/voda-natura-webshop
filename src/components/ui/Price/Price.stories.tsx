import type { Meta, StoryObj } from '@storybook/react-vite';
import { Price } from './Price';

const meta = {
  title: 'UI/Price',
  component: Price,
  parameters: { docs: { description: { component: 'Price with VAT, Serbian format (56.899 RSD). **sm** cartridge tiles and phone cards, **md** product cards, **lg** product page (Price text style, brand green).' } } },
  args: { amount: 56899, size: 'md' },
} satisfies Meta<typeof Price>;
export default meta;
export const Card: StoryObj<typeof meta> = {};
export const Small: StoryObj<typeof meta> = { args: { amount: 606, size: 'sm' } };
export const ProductPage: StoryObj<typeof meta> = { args: { size: 'lg', brand: true } };
