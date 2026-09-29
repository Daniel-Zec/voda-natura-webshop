import type { Meta, StoryObj } from '@storybook/react-vite';
import { SiteHeader } from './SiteHeader';
import { mainNav, finderLink } from '../../../config/navigation';

const meta = {
  title: 'Layout/SiteHeader',
  component: SiteHeader,
  parameters: { layout: 'fullscreen', docs: { description: { component: 'Header with search, help, compare and cart, plus the category menu (desktop). On phones: menu, logo, phone and cart, with search below; the menu is a `<details>` drawer, no JavaScript. Counters are filled by the cart script.' } } },
  args: {
    homeHref: '#',
    logoSrc: 'images/brand/vodanatura-logo.svg',
    searchAction: '#',
    helpHref: '#',
    compareHref: '#',
    cartHref: '#',
    nav: mainNav,
    finder: finderLink,
  },
} satisfies Meta<typeof SiteHeader>;
export default meta;
export const Desktop: StoryObj<typeof meta> = { globals: { viewport: { value: 'desktop' } } };
export const Phone: StoryObj<typeof meta> = { globals: { viewport: { value: 'phone' } } };
