import type { Meta, StoryObj } from '@storybook/react-vite';
import { ArrowLink } from './ArrowLink';

const meta = {
  title: 'UI/ArrowLink',
  component: ArrowLink,
  parameters: { docs: { description: { component: '"See all" style text link with an arrow that nudges on hover. 44 px tall for touch.' } } },
  args: { href: '#', children: 'Svi ulošci po veličini' },
} satisfies Meta<typeof ArrowLink>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
