import type { Meta, StoryObj } from '@storybook/react-vite';
import { Breadcrumbs } from './Breadcrumbs';

const meta = {
  title: 'UI/Breadcrumbs',
  component: Breadcrumbs,
  parameters: { docs: { description: { component: 'Trail on every category and product page (SEO guide), paired with BreadcrumbList JSON-LD. On phones only the last two steps show, with a back arrow.' } } },
  args: {
    items: [
      { label: 'Početna', href: '#' },
      { label: 'Sistemi za vodu', href: '#' },
      { label: 'Voda za piće', href: '#' },
      { label: 'Reverzna osmoza', href: '#' },
      { label: 'RO 6 WFU' },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Phone: StoryObj<typeof meta> = { globals: { viewport: { value: 'phone' } } };
