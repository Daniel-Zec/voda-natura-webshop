import type { Meta, StoryObj } from '@storybook/react-vite';
import { FaqList } from './FaqList';
import { homeFaq } from '../../../data/home';

const meta = {
  title: 'Shop/FaqList',
  component: FaqList,
  parameters: { docs: { description: { component: 'FAQ accordion on native `<details>`: no JavaScript, keyboard accessible, and answers stay in the HTML when closed (SEO guide). The homepage also outputs them as FAQPage JSON-LD.' } } },
  args: { items: homeFaq },
  decorators: [(Story) => <div style={{ maxWidth: 780 }}><Story /></div>],
} satisfies Meta<typeof FaqList>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const AllClosed: StoryObj<typeof meta> = { args: { defaultOpen: -1 } };
