import type { Meta, StoryObj } from '@storybook/react-vite';
import { Icon, iconNames } from './Icon';

const meta = {
  title: 'UI/Icon',
  component: Icon,
  parameters: { docs: { description: { component: 'Line icon from the VodaNatura set. Without `label` it is decorative (`aria-hidden`). All icons: Foundations → Icons.' } } },
  argTypes: { name: { control: 'select', options: iconNames } },
  args: { name: 'drop', size: 32 },
} satisfies Meta<typeof Icon>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
export const Coloured: StoryObj<typeof meta> = { args: { name: 'check', style: { color: 'var(--vn-color-action-primary)' }, strokeWidth: 2.4 } };
