import type { Meta, StoryObj } from '@storybook/react-vite';
import { TrustBar } from './TrustBar';

const meta = {
  title: 'Shop/TrustBar',
  component: TrustBar,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'The four promises. One bar with four columns from 1024 px; a 2 × 2 grid of small cards on phones (titles only, `shortTitle` if given).' } } },
  args: {
    items: [
      { icon: 'cash', tone: 'natura', title: 'Plaćate tek kad stigne', text: 'Gotovinom kuriru, pri preuzimanju paketa.' },
      { icon: 'shield', tone: 'natura', title: 'Garancija 2 godine', text: 'Na uređaje i kućišta, uz stručnu ugradnju.' },
      { icon: 'award', tone: 'water', title: 'Sertifikovana kućišta', shortTitle: 'Atest Instituta „Batut”', text: 'EU sertifikat i atest Instituta „Batut”.' },
      { icon: 'phone', tone: 'water', title: 'Pomoć telefonom', text: 'Pri izboru i ugradnji – i vašem majstoru.' },
    ],
  },
  decorators: [(Story) => <div style={{ padding: 24 }}><Story /></div>],
} satisfies Meta<typeof TrustBar>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Phone: StoryObj<typeof meta> = { globals: { viewport: { value: 'phone' } } };
