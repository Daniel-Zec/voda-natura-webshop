import type { Meta, StoryObj } from '@storybook/react-vite';
import { CartridgeCard } from './CartridgeCard';
import { popularCartridges } from '../../../data/home';

const meta = {
  title: 'Shop/CartridgeCard',
  component: CartridgeCard,
  parameters: { docs: { description: { component: 'Tile for repeat cartridge orders, with a quick "+" add button. Sits on the warm reorder band.' } } },
  args: { cartridge: popularCartridges[0], href: '#' },
  globals: { backgrounds: { value: 'warm' } },
  decorators: [(Story) => <div style={{ maxWidth: 240 }}><Story /></div>],
} satisfies Meta<typeof CartridgeCard>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
