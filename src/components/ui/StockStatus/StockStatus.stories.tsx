import type { Meta, StoryObj } from '@storybook/react-vite';
import { StockStatus } from './StockStatus';

const meta = {
  title: 'UI/StockStatus',
  component: StockStatus,
  parameters: { docs: { description: { component: 'Availability from the Decor Ambient stock import. **madeToOrder** is the agreed "Po porudžbini, 3–4 meseca" state (CW 929, Matteo); those products stay orderable.' } } },
  args: { state: 'inStock', size: 'md' },
} satisfies Meta<typeof StockStatus>;
export default meta;
export const InStock: StoryObj<typeof meta> = {};
export const OutOfStock: StoryObj<typeof meta> = { args: { state: 'outOfStock' } };
export const MadeToOrder: StoryObj<typeof meta> = { args: { state: 'madeToOrder' } };
