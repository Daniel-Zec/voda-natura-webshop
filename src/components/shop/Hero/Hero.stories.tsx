import type { Meta, StoryObj } from '@storybook/react-vite';
import { Hero } from './Hero';

const img = (w: number) => `images/hero/filtrirana-voda-iz-slavine-${w}.webp`;
const meta = {
  title: 'Shop/Hero',
  component: Hero,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Homepage hero. The overline is part of the H1 so the page heading carries the keyword ("Filteri za vodu…"), fixing the SEO gap found in the mock-up review. Photo with white fade on desktop; photo above a text card on phones.' } } },
  args: {
    overline: 'Filteri za vodu za stanove i kuće u Srbiji',
    overlineShort: 'Filteri za vodu za stanove i kuće',
    title: 'Čista voda iz vaše slavine. Bez nošenja flaša.',
    lead: 'Filter ugrađen ispod sudopere daje vodu za piće i kuvanje za celu porodicu – svaki dan, bez gajbi, kesa i plastike.',
    image: { src: img(1680), srcSet: [640, 960, 1680].map((w) => `${img(w)} ${w}w`).join(', '), alt: 'Filtrirana voda iz kuhinjske slavine puni čašu' },
    primary: { href: '#', label: 'Pronađi pravi filter', note: '5 pitanja' },
    secondary: { href: '#', label: 'Pogledaj sisteme' },
    promises: ['Plaćanje pouzećem', 'Garancija 2 godine', 'Bez registracije'],
  },
  decorators: [(Story) => <div style={{ padding: 24, maxWidth: 1248, margin: '0 auto' }}><Story /></div>],
} satisfies Meta<typeof Hero>;
export default meta;
export const Desktop: StoryObj<typeof meta> = {};
export const Phone: StoryObj<typeof meta> = { globals: { viewport: { value: 'phone' } } };
