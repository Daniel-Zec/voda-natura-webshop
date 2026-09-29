import type { Meta, StoryObj } from '@storybook/react-vite';
import { CategoryCard } from './CategoryCard';
import { categories } from '../../../data/home';

const meta = {
  title: 'Shop/CategoryCard',
  component: CategoryCard,
  parameters: { docs: { description: { component: 'Category tile: photo, name and the problem it solves. `wideOnMobile` turns the last tile of an odd grid into a full-width row on phones.' } } },
  args: { category: categories[0], href: '#' },
  decorators: [(Story) => <div style={{ maxWidth: 240 }}><Story /></div>],
} satisfies Meta<typeof CategoryCard>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Row: StoryObj<typeof meta> = {
  args: { category: categories[4], wideOnMobile: true },
  decorators: [(Story) => <div style={{ maxWidth: 360 }}><Story /></div>],
  globals: { viewport: { value: 'phone' } },
};
