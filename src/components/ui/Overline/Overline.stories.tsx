import type { Meta, StoryObj } from '@storybook/react-vite';
import { Overline } from './Overline';

const meta = {
  title: 'UI/Overline',
  component: Overline,
  parameters: { docs: { description: { component: 'Uppercase 11 px label above a heading. Tone matches the panel: brand on green, info on blue, sand on warm.' } } },
  args: { children: 'Flaširana voda vs. filter', tone: 'brand' },
} satisfies Meta<typeof Overline>;
export default meta;
export const Brand: StoryObj<typeof meta> = {};
export const Info: StoryObj<typeof meta> = { args: { tone: 'info', children: 'Ne znam šta mi treba' } };
export const Sand: StoryObj<typeof meta> = { args: { tone: 'sand', children: 'Znam šta tražim' } };
