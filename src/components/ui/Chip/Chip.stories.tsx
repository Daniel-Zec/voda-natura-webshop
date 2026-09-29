import type { Meta, StoryObj } from '@storybook/react-vite';
import { Chip } from './Chip';

const meta = {
  title: 'UI/Chip',
  component: Chip,
  parameters: { docs: { description: { component: 'Quick link pill, e.g. popular cartridge codes. Use **sand** on warm panels, **neutral** on white.' } } },
  args: { href: '#', children: 'BL 10 – ugljeni blok', tone: 'sand' },
} satisfies Meta<typeof Chip>;
export default meta;
export const Sand: StoryObj<typeof meta> = { globals: { backgrounds: { value: 'warm' } } };
export const Neutral: StoryObj<typeof meta> = { args: { tone: 'neutral' } };
