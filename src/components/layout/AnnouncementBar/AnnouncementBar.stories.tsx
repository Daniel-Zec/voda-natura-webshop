import type { Meta, StoryObj } from '@storybook/react-vite';
import { AnnouncementBar } from './AnnouncementBar';

const meta = {
  title: 'Layout/AnnouncementBar',
  component: AnnouncementBar,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Green strip above the header. All items from 900 px; only the first (cash on delivery) on phones.' } } },
  args: {
    items: [
      { icon: 'cash', text: 'Plaćate tek kad stigne – pouzećem' },
      { icon: 'truck', text: 'Dostava BEX kurirskom službom širom Srbije' },
      { icon: 'phone', text: 'Pomoć pri izboru: [TELEFON]' },
    ],
  },
} satisfies Meta<typeof AnnouncementBar>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
