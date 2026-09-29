import type { Meta, StoryObj } from '@storybook/react-vite';
import { Button } from './Button';
import { iconNames } from '../Icon/Icon';

const meta = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          'The one button of the shop. **Primary (green)** = buying actions (Dodaj u korpu, Poruči). **Secondary (blue)** = guidance (Pronađi pravi filter). **Outline** = the neutral second choice next to a filled button. **Outline brand** = phone call and secondary guidance. Pass `href` to render a link.',
      },
    },
  },
  argTypes: {
    icon: { control: 'select', options: [undefined, ...iconNames] },
    iconAfter: { control: 'select', options: [undefined, ...iconNames] },
  },
  args: { children: 'Dodaj u korpu', variant: 'primary', size: 'md' },
} satisfies Meta<typeof Button>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};
export const Secondary: Story = { args: { variant: 'secondary', children: 'Pronađi pravi filter', size: 'lg' } };
export const Outline: Story = { args: { variant: 'outline', children: 'Pogledaj sisteme', size: 'lg' } };
export const OutlineBrand: Story = { args: { variant: 'outlineBrand', children: '[TELEFON]', icon: 'phone', size: 'lg' } };
export const Ghost: Story = { args: { variant: 'ghost', children: 'Saznaj više' } };
export const IconOnly: Story = { args: { iconOnly: true, icon: 'cart', 'aria-label': 'Dodaj u korpu' } };
export const Disabled: Story = { args: { disabled: true, children: 'Nema na stanju' } };

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center' }}>
      <Button>Dodaj u korpu</Button>
      <Button variant="secondary">Pronađi pravi filter</Button>
      <Button variant="outline">Pogledaj sisteme</Button>
      <Button variant="outlineBrand" icon="phone">[TELEFON]</Button>
      <Button variant="ghost">Saznaj više</Button>
      <Button iconOnly icon="plus" aria-label="Dodaj" />
      <Button disabled>Nema na stanju</Button>
    </div>
  ),
};
