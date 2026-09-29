import type { Meta, StoryObj } from '@storybook/react-vite';
import { Badge } from './Badge';

const meta = {
  title: 'UI/Badge',
  component: Badge,
  parameters: { docs: { description: { component: 'Label on product images: **info** = recommendation ("Najbolje za piće"), **natura** = best value ("Najpovoljniji start"), **sand** = audience ("Za kuće"), success / warning / neutral for states.' } } },
  args: { children: 'Najbolje za piće', tone: 'info' },
} satisfies Meta<typeof Badge>;
export default meta;
export const Info: StoryObj<typeof meta> = {};
export const All: StoryObj<typeof meta> = {
  render: () => (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      <Badge tone="info">Najbolje za piće</Badge>
      <Badge tone="natura">Najpovoljniji start</Badge>
      <Badge tone="sand">Za kuće</Badge>
      <Badge tone="success">Novo</Badge>
      <Badge tone="warning">Po porudžbini</Badge>
      <Badge tone="neutral">Rasprodato</Badge>
    </div>
  ),
};
