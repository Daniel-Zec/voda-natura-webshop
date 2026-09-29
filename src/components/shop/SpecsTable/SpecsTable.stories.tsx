import type { Meta, StoryObj } from '@storybook/react-vite';
import { SpecsTable } from './SpecsTable';

const meta = {
  title: 'Shop/SpecsTable',
  component: SpecsTable,
  parameters: { docs: { description: { component: 'Specs as a real HTML table. Filled from the "Label: value" lines of the partner text during import; editable in the admin panel later.' } } },
  args: {
    specs: [
      { label: 'Radna temperatura', value: '2-30°C' },
      { label: 'Maksimalni radni pritisak', value: '2,8 – 6 bara' },
      { label: 'RO membrana', value: '75 GPD (284 lit/dan)' },
      { label: 'Servisni ciklus', value: '6 meseci' },
    ],
  },
  decorators: [(Story) => <div style={{ maxWidth: 640 }}><Story /></div>],
} satisfies Meta<typeof SpecsTable>;
export default meta;
export const Default: StoryObj<typeof meta> = {};
