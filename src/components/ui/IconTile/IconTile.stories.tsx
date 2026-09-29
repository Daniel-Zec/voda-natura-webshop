import type { Meta, StoryObj } from '@storybook/react-vite';
import { IconTile } from './IconTile';

const meta = {
  title: 'UI/IconTile',
  component: IconTile,
  parameters: { docs: { description: { component: 'Icon on a soft rounded tile. **natura / water** use the decorative logo colours (trust bar); **info / brand** use the darker action colours (info cards next to a heading).' } } },
  args: { icon: 'cash', tone: 'natura' },
} satisfies Meta<typeof IconTile>;
export default meta;
export const All: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'flex', gap: 12 }}>
      <IconTile icon="cash" tone="natura" />
      <IconTile icon="award" tone="water" />
      <IconTile icon="wrench" tone="info" size="lg" />
      <IconTile icon="flask" tone="brand" size="lg" />
    </div>
  ),
};
