import type { Meta, StoryObj } from '@storybook/react-vite';
import { GuideCard } from './GuideCard';

const meta = {
  title: 'Shop/GuideCard',
  component: GuideCard,
  parameters: {
    docs: { description: { component: 'Card for a "Saveti o vodi" guide on /vodic/ and under articles ("Pročitajte još"). The whole card is a link; `featured` is the large card for the top guide.' } },
  },
  args: {
    guide: {
      title: 'Hlor u vodi: zašto voda miriše na bazen i kako da to rešite',
      description: 'Hlor se dodaje vodi da bi bila bezbedna, ali menja ukus i miris. Saznajte koliko hlora sme da bude u vodi i koji filter ga uklanja.',
      href: '#',
      topic: 'Ukus i hlor',
      minutes: 4,
      image: { src: 'images/vodic/hlor-u-vodi.webp', alt: '' },
    },
  },
  decorators: [(Story) => <div style={{ maxWidth: 360 }}><Story /></div>],
} satisfies Meta<typeof GuideCard>;
export default meta;

export const Default: StoryObj<typeof meta> = {};
export const Featured: StoryObj<typeof meta> = {
  args: {
    variant: 'featured',
    headingLevel: 2,
    guide: {
      title: 'Flaširana voda ili filter: koliko plastike i novca ostaje u kući',
      description: 'Flaširana voda sadrži više sitnih čestica plastike od vode iz slavine, a porodicu od četiri člana košta oko 130.000 dinara godišnje.',
      href: '#',
      topic: 'Flaširana voda',
      minutes: 4,
      image: { src: 'images/vodic/flasirana-voda-ili-filter.webp', alt: '' },
    },
  },
  decorators: [(Story) => <div style={{ maxWidth: 1200 }}><Story /></div>],
};
