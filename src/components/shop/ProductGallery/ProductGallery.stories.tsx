import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductGallery } from './ProductGallery';

const img = (n: string) => ({ src: `images/products/${n}.webp`, alt: n });
const meta = {
  title: 'Shop/ProductGallery',
  component: ProductGallery,
  parameters: { docs: { description: { component: 'Product photos with thumbnails. Switching works with CSS only (radio buttons), no JavaScript. First image loads eagerly as the main image.' } } },
  args: { name: 'RO 6 WFU', images: [img('ro-6-wfu-reverzna-osmoza'), img('fscnt-kuhinjski-filter'), img('bl-10-ugljeni-blok-ulozak')] },
  decorators: [(Story) => <div style={{ maxWidth: 480 }}><Story /></div>],
} satisfies Meta<typeof ProductGallery>;
export default meta;
export const Several: StoryObj<typeof meta> = {};
export const Single: StoryObj<typeof meta> = { args: { images: [img('ws-20-primo-omeksivac-vode')] } };
export const NoPhoto: StoryObj<typeof meta> = { args: { images: [] } };
