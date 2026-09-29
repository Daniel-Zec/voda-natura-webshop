import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { QuantityStepper } from './QuantityStepper';

const meta = {
  title: 'UI/QuantityStepper',
  component: QuantityStepper,
  parameters: { docs: { description: { component: '− value + control with 44 px buttons. Used in the savings calculator; will also be the quantity control in the cart.' } } },
  args: { value: 4, onChange: () => {}, min: 1, max: 10, decreaseLabel: 'Manje', increaseLabel: 'Više' },
} satisfies Meta<typeof QuantityStepper>;
export default meta;
export const Interactive: StoryObj<typeof meta> = {
  render: (args) => {
    const [v, setV] = useState(args.value);
    return <QuantityStepper {...args} value={v} onChange={setV} />;
  },
};
export const WithUnit: StoryObj<typeof meta> = {
  args: { value: 45, step: 5, min: 10, max: 200, unit: 'RSD', valueWidth: 84 },
  render: (args) => {
    const [v, setV] = useState(args.value);
    return <QuantityStepper {...args} value={v} onChange={setV} />;
  },
};
