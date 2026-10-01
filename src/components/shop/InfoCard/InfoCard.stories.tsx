import type { Meta, StoryObj } from '@storybook/react-vite';
import { InfoCard } from './InfoCard';

const meta = {
  title: 'Shop/InfoCard',
  component: InfoCard,
  parameters: { docs: { description: { component: 'Bordered card with icon, heading, text and a link, for services (installation, water analysis).' } } },
  args: {
    icon: 'flask',
    tone: 'brand',
    title: 'Niste sigurni kakvu vodu imate?',
    children: 'Uradite analizu u najbližem zavodu za javno zdravlje i pošaljite nam rezultate. Naš tehnolog besplatno predlaže sistem.',
    link: { href: '#', label: 'Kako do analize vode' },
  },
  decorators: [(Story) => <div style={{ maxWidth: 600 }}><Story /></div>],
} satisfies Meta<typeof InfoCard>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Installation: StoryObj<typeof meta> = {
  args: { icon: 'wrench', tone: 'info', title: 'Ugradnja', children: 'U Subotici i okolini ugradnju radi serviser našeg partnera – kontaktirajte nas.', link: { href: '#', label: 'Kako teče ugradnja' } },
};
