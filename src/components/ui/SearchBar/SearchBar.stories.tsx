import type { Meta, StoryObj } from '@storybook/react-vite';
import { SearchBar } from './SearchBar';

const meta = {
  title: 'UI/SearchBar',
  component: SearchBar,
  parameters: { docs: { description: { component: 'Search by product name or SKU. A plain GET form (`?q=`), so it works without JavaScript. **muted** in the header, **warm** on the sand "Znam šta tražim" panel with a text button.' } } },
  args: { action: '#' },
  decorators: [(Story) => <div style={{ maxWidth: 560 }}><Story /></div>],
} satisfies Meta<typeof SearchBar>;
export default meta;
export const Header: StoryObj<typeof meta> = {};
export const WarmPanel: StoryObj<typeof meta> = {
  args: { tone: 'warm', size: 'lg', buttonLabel: 'Traži', placeholder: 'npr. STO 10, PS 5M, RO 6', label: 'Šifra ili naziv' },
  globals: { backgrounds: { value: 'warm' } },
};
