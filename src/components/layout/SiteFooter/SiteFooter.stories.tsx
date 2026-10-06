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
    contact: { phone: '+381 63 29 22 19', email: 'info@vodanatura.com', hours: 'Ponedeljak–petak, 8–16 h', address: ['Filipa Kljajića 22', '24000 Subotica'] },
    legal: footerNav.legal,
    social: [
      { network: 'instagram', label: 'Instagram', href: '' },
      { network: 'facebook', label: 'Facebook', href: '' },
    ],
    year: 2026,
  },
} satisfies Meta<typeof SiteFooter>;
export default meta;
/** Social links not set yet: icons are dimmed and not clickable. */
export const Default: StoryObj<typeof meta> = {};
/** With real profile links: icons are clickable and open in a new tab. */
export const WithSocialLinks: StoryObj<typeof meta> = {
  args: {
    social: [
      { network: 'instagram', label: 'Instagram', href: 'https://www.instagram.com/' },
      { network: 'facebook', label: 'Facebook', href: 'https://www.facebook.com/' },
    ],
  },
};
