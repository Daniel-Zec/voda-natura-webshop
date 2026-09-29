import type { Meta, StoryObj } from '@storybook/react-vite';
import { ProductCard } from './ProductCard';
import { featuredProducts } from '../../../data/home';

const meta = {
  title: 'Shop/ProductCard',
  component: ProductCard,
  parameters: {
    docs: {
      description: {
        component:
          'Card for systems. **responsive** (default) is a compact row on phones and a full card from 768 px, as in the two mock-ups. Buttons carry `data-add-to-cart` / `data-compare`, handled by the page cart script, so the card needs no React on the live site. Out-of-stock disables the cart buttons; made-to-order stays orderable.',
      },
    },
  },
  args: { product: featuredProducts[0], href: '#' },
  decorators: [(Story) => <div style={{ maxWidth: 300 }}><Story /></div>],
} satisfies Meta<typeof ProductCard>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Vertical: Story = { args: { layout: 'vertical' } };
export const Horizontal: Story = { args: { layout: 'horizontal' }, decorators: [(Story) => <div style={{ maxWidth: 360 }}><Story /></div>] };
export const MadeToOrder: Story = {
  args: { layout: 'vertical', product: { ...featuredProducts[2], stock: 'madeToOrder', badge: undefined } },
};
export const OutOfStock: Story = { args: { layout: 'vertical', product: { ...featuredProducts[3], stock: 'outOfStock' } } };
export const Grid: Story = {
  decorators: [(Story) => <div style={{ maxWidth: 1200 }}><Story /></div>],
  render: () => (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 24 }}>
      {featuredProducts.map((p) => <ProductCard key={p.sku} product={p} href="#" layout="vertical" />)}
    </div>
  ),
};
