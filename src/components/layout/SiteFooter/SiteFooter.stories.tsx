import type { Meta, StoryObj } from '@storybook/react-vite';
import { SiteFooter } from './SiteFooter';
import { footerNav } from '../../../config/navigation';

const meta = {
  title: 'Layout/SiteFooter',
  component: SiteFooter,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Dark footer with the partner note, link groups (the SEO guide asks for guides, about and contact links), contact and legal pages.' } } },
  args: {
    logoSrc: 'images/brand/vodanatura-logo-inverse.svg',
    about: 'Filteri vode za vaš dom. VodaNatura radi u saradnji sa kompanijom Decor Ambient d.o.o. iz Subotice, koja pakuje i šalje porudžbine.',
    groups: [footerNav.shop, footerNav.buying, footerNav.about],
    contact: { phone: '[TELEFON]', email: 'info@vodanatura.com', hours: 'Radnim danima [RADNO VREME]' },
    legal: footerNav.legal,
    year: 2026,
  },
} satisfies Meta<typeof SiteFooter>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
